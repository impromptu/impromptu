should = require 'should'
Impromptu = require '../src/impromptu'
fs = require 'fs'
redis = require 'redis'
async = require 'async'
exec = require('child_process').exec

# Skip the database tests on Travis CI
# Todo: Make these work
return if process.env.TRAVIS is 'true'

Impromptu.DB.REDIS_PORT = 6421
Impromptu.DB.REDIS_CONF_FILE = '../test/etc/redis.conf'
Impromptu.DB.REDIS_PID_FILE = '/usr/local/var/run/redis-impromptu-test.pid'

describe 'Database', ->
  # Try to kill the server if it's running.
  before (done) ->
    # Check if the server is running.
    path = Impromptu.DB.REDIS_PID_FILE
    return done() unless fs.existsSync path

    # Fetch the process ID and kill it.
    pid = parseInt fs.readFileSync(path), 10
    # Make it die a painful death.
    exec "kill -9 #{pid}", done

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
    db = new Impromptu.DB
    client = db.client()
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
    db = new Impromptu.DB
    db.client().on 'end', done
    db.shutdown()


describe 'Cache', ->
  impromptu = new Impromptu()
  background = new Impromptu
    background: true

  before (done) ->
    async.series [
      (fn) ->
        impromptu.db.client().on 'connect', fn
      (fn) ->
        impromptu.db.client().flushdb fn
      (fn) ->
        background.db.client().on 'connect', fn
    ], done

  it 'should create a method', ->
    method = impromptu.cache
      name: 'method'
      update: (fn) ->
        fn 'value'

    should.exist method

  it 'should be null on first miss', (done) ->
    cached = impromptu.cache
      name: 'missing'
      update: (fn) ->
        should.fail 'Update should not run.'
        fn 'value'

    cached (err, value) ->
      should.not.exist value
      done()

  it 'should update when background is set', (done) ->
    cached = background.cache
      name: 'should-update'
      update: (fn) ->
        done()
        fn 'value'

    cached()

  it 'should fetch cached values', (done) ->
    updater = background.cache
      name: 'should-fetch'
      update: (fn) ->
        fn 'value'

    fetcher = impromptu.cache
      name: 'should-fetch'
      update: (fn) ->
        should.fail 'Update should not run.'
        fn 'value'

    async.series [
      (fn) ->
        fetcher (err, fetched) ->
          should.not.exist fetched
          fn err

      (fn) ->
        updater (err, updated) ->
          updated.should.equal 'value'
          fn err

      (fn) ->
        fetcher (err, fetched) ->
          fetched.should.equal 'value'
          fn err
    ], done
