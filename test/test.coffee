should = require 'should'
Impromptu = require '../lib/impromptu.js'
fs = require 'fs'
redis = require 'redis'
exec = require('child_process').exec

describe 'Impromptu', ->
  it 'should exist', ->
    should.exist Impromptu

describe 'DB', ->
  # Try to kill the server if it's running.
  before ->
    # Check if the server is running.
    path = Impromptu.DB.REDIS_PID_FILE
    return unless fs.existsSync path

    # Fetch the process ID and kill it.
    pid = parseInt fs.readFileSync(path), 10
    # Make it die a painful death.
    exec "kill -9 #{pid}"

  it 'should exist', ->
    should.exist Impromptu.DB

  it 'should be stopped', (done) ->
    client = redis.createClient Impromptu.DB.REDIS_PORT

    client.on 'error', ->
      client.quit()
      done()

    client.on 'connect', ->
      client.quit()
      done new Error 'Database connected.'

    client.on 'reconnecting', ->
      client.removeAllListeners()

  it 'should start', (done) ->
    client = new Impromptu.DB().client()
    client.on 'connect', ->
      client.quit()
      done()

    client.once 'error', ->
      # On the first error, the client will try to spawn the server.
      # If it encounters another error, it failed.
      client.once 'error', ->
        client.quit()
        done new Error 'Database did not connect.'

      client.on 'reconnecting', ->
        client.removeAllListeners

  it 'should stop', (done) ->
    DB = new Impromptu.DB()
    client = DB.client()
    client.on 'end', ->
      done()

    DB.shutdown()


