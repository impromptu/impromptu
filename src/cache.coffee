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


class Cache
  constructor: (@impromptu) ->

  key: (options) ->
    parts = []

    parts.push options.name if options.name

    if options.directory
      if options.directory is true
        parts.push process.cwd()
      else
        parts.push options.directory

    parts.join ':'


  del: (options, fn) =>
    key = @key key
    client.del key, "lock:#{key}", "lock-process:#{key}", fn


  build: (options) =>
    key = @key options

    return unless key

    (callback) =>
      client = @impromptu.db.client()

      # If this process isn't being run in the background,
      # just try to fetch the cached value.
      return client.get key, callback unless @impromptu.options.background

      # Try to update the cached value.
      async.waterfall [
        # Check if the cached value is locked (and therefore still valid).
        (done) ->
          client.exists "lock:#{key}", done

        # Check if there's a process already running to update the cache.
        (exists, done) ->
          throw new CacheError() if exists
          client.get "lock-process:#{key}", done

        (pid, done) =>
          # If there's an update process, check that it's still running.
          throw new CacheError() if pid and processIsRunning pid

          # Time to update the cache.
          # Set the process lock.
          client.set "lock-process:#{key}", process.pid

          # Run the provided method to generate the new value to cache.
          options.update (value) ->
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
        if err and err not instanceof CacheError
          throw err

        # When the updating sequence completes (or bails), return the cached
        # value to the provided callback.
        client.get key, callback

# Expose `Cache`.
exports = module.exports = Cache
