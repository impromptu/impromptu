Impromptu = require './impromptu'
async = require 'async'
exec = require('child_process').exec

class CacheError extends Impromptu.Error

processIsRunning = (pid) ->
  # Attempt to ping the process.
  try
    process.kill pid, 0

  # If pinging the server throws an error (ESRCH), then the process isn't running.
  catch ersch
    return true

  return false


class Cache extends Impromptu.Cacheable
  @Error: CacheError

  key: ->
    parts = [@name]

    if @options.directory
      if @options.directory is true
        parts.push process.cwd()
      else
        parts.push @options.directory

    parts.join ':'


  client: ->
    @impromptu.db.client()

  run: (fn) =>
    # If this process isn't being run in the background,
    # just try to fetch the cached value.
    return @get fn unless @impromptu.options.background

    # If this process is running in the background, try to update
    # the cached value, then fetch the cached value.
    @set (err, results) =>
      if err then fn err else @get fn


  unset: (fn) ->
    key = @key()
    @client().del key, "lock:#{key}", "lock-process:#{key}", fn


  get: (fn) ->
    @client().get @key(), fn


  set: (fn) ->
    client = @client()
    key = @key()
    options = @options

    # Try to update the cached value.
    async.waterfall [
      # Check if the cached value is locked (and therefore still valid).
      (done) ->
        client.exists "lock:#{key}", done

      # Check if there's a process already running to update the cache.
      (exists, done) ->
        if exists
          throw new CacheError 'The key is currently locked.'

        client.get "lock-process:#{key}", done

      (pid, done) ->
        # If there's an update process, check that it's still running.
        if pid and processIsRunning pid
          throw new CacheError 'A process is currently updating this key.'

        # Time to update the cache.
        # Set the process lock.
        client.set "lock-process:#{key}", process.pid

        # Run the provided method to generate the new value to cache.
        options.update.call options.context, (err, value) ->
          return done err if err

          # Update the cache with the new value and locks.
          async.parallel [
            (fin) ->
              # Update the cached value.
              client.set key, value.toString(), fin

            (fin) ->
              return fin() unless options.expire

              # If the cached value should be stored for a certain amount of
              # time, set the lock and expiration timer.
              client.set "lock:#{key}", true, (err) ->
                fin err if err
                client.expire "lock:#{key}", options.expire, fin
          ], (err) ->
            done err if err

            # Unset the lock process; the value has been updated.
            client.del "lock-process:#{key}", done
    ], (err, results) ->
      # If we catch a `CacheError`, the update sequence bailed;
      # set the result to `false`.
      if err and err instanceof CacheError
        return fn err, false

      # Otherwise, the update was successful if there was no error.
      fn err, !!err


# Expose `Cache`.
exports = module.exports = Cache
