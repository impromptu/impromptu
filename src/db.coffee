redis = require 'redis'
fs = require 'fs'
path = require 'path'
spawn = require('child_process').spawn

db =
  REDIS_CONF_FILE: '../etc/redis.conf'
  REDIS_PID_FILE: '/usr/local/var/run/redis-impromptu.pid'
  REDIS_PORT: 6420

  # Returns the connection to the Redis server.
  client: ->
    # If the client object isn't cached, create a new connection.
    unless db._client
      db._client = redis.createClient db.REDIS_PORT

      # If the client throws an error, attempt to spawn the Redis server.
      # The client will automatically attempt to reconnect, so if we
      # successfully start the server, things will proceed normally.
      db._client.once 'error', db._spawnServerFromError

      # If the client connects error-free, ensure the error handler is removed.
      db._client.on 'connect', ->
        db._client.removeListener 'error', db._spawnServerFromError

    db._client

  shutdown: ->
    # We don't use `@client()` here because we don't want to spawn the server
    # if it isn't already running.
    #
    # If we don't have a cached client, attempt to connect.
    db._client = redis.createClient db.REDIS_PORT unless db._client

    # Remove the error handler that will spawn the server.
    db._client.removeListener 'error', db._spawnServerFromError

    # Silently absorb any errors.
    db._client.on 'error', ->

    # Shut down the server and gracefully disconnect.
    db._client.shutdown()
    db._client.quit()

  # Start the `redis-server` daemon if it doesn't already exist.
  _spawnServerFromError: (error) ->
    # If the server's PID file exists, check if it's accurate.
    if fs.existsSync db.REDIS_PID_FILE
      # Fetch the process ID.
      pid = parseInt fs.readFileSync(db.REDIS_PID_FILE), 10

      # Attempt to ping the process.
      try
        process.kill pid, 0
        # If we can ping the server, then we don't know what error we received.
        throw error

      # If pinging the server throws an error (ESRCH), then we know the PID
      # file is inaccurate; remove it.
      catch ersch
        fs.unlinkSync db.REDIS_PID_FILE

    # Spawn the server using the Impromptu server settings.
    spawn 'redis-server', [path.resolve __dirname, db.REDIS_CONF_FILE]

# Expose `db`.
exports = module.exports = db