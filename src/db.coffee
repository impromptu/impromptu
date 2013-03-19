redis = require 'redis'
fs = require 'fs'
path = require 'path'
spawn = require('child_process').spawn

class DB
  @REDIS_PID_FILE = '/usr/local/var/run/redis-impromptu.pid'
  @REDIS_PORT = 6420

  constructor: ->

  # Returns the connection to the Redis server.
  client: ->
    # If the client object isn't cached, create a new connection.
    unless @_client
      @_client = redis.createClient DB.REDIS_PORT

      # If the client throws an error, attempt to spawn the Redis server.
      # The client will automatically attempt to reconnect, so if we
      # successfully start the server, things will proceed normally.
      @_client.once 'error', @_spawnServerFromError

      # If the client connects error-free, ensure the error handler is removed.
      @_client.on 'connect', =>
        @_client.removeListener 'error', @_spawnServerFromError

    @_client

  shutdown: ->
    # We don't use `@client()` here because we don't want to spawn the server
    # if it isn't already running.
    #
    # If we don't have a cached client, attempt to connect.
    @_client = redis.createClient DB.REDIS_PORT unless @_client

    # Remove the error handler that will spawn the server.
    @_client.removeListener 'error', @_spawnServerFromError

    # Silently absorb any errors.
    @_client.on 'error', ->

    # Shut down the server and gracefully disconnect.
    @_client.shutdown()
    @_client.quit()

  # Start the `redis-server` daemon if it doesn't already exist.
  _spawnServerFromError: (error) ->
    # If the server's PID file exists, check if it's accurate.
    if fs.existsSync DB.REDIS_PID_FILE
      # Fetch the process ID.
      pid = parseInt fs.readFileSync(DB.REDIS_PID_FILE), 10

      # Attempt to ping the process.
      try
        process.kill pid, 0
        # If we can ping the server, then we don't know what error we received.
        throw error

      # If pinging the server throws an error (ESRCH), then we know the PID
      # file is inaccurate; remove it.
      catch ersch
        fs.unlinkSync DB.REDIS_PID_FILE

    # Spawn the server using the Impromptu server settings.
    spawn 'redis-server', [path.resolve __dirname, '../etc/redis.conf']

# Expose `DB`.
exports = module.exports = DB;