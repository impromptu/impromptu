should = require 'should'
Impromptu = require '../src/impromptu'
fs = require 'fs'
redis = require 'redis'
exec = require('child_process').exec

# Skip the database tests on Travis CI
# Todo: Make these work
return if process.env.TRAVIS is 'true'

describe 'Impromptu', ->
  it 'should exist', ->
    should.exist Impromptu

describe 'Database', ->
  # Try to kill the server if it's running.
  before (done) ->
    # Check if the server is running.
    path = Impromptu.db.REDIS_PID_FILE
    return done() unless fs.existsSync path

    # Fetch the process ID and kill it.
    pid = parseInt fs.readFileSync(path), 10
    # Make it die a painful death.
    exec "kill -9 #{pid}", done

  after ->
    delete Impromptu.db._client

  it 'should exist', ->
    should.exist Impromptu.db

  it 'should be stopped', (done) ->
    client = redis.createClient Impromptu.db.REDIS_PORT

    client.on 'error', ->
      client.quit()
      done()

    client.on 'connect', ->
      client.quit()
      done new Error 'Database connected.'

    client.on 'reconnecting', ->
      client.removeAllListeners()

  it 'should start', (done) ->
    client = Impromptu.db.client()
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
    # TODO: This is a race condition, and should be fixed.
    done() unless Impromptu.db._client.connected

    Impromptu.db.client().on 'end', done
    Impromptu.db.shutdown()
