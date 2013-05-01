should = require 'should'
environment = require './shared/environment'
Impromptu = require '../src/impromptu'
fs = require 'fs'
redis = require 'redis'
async = require 'async'
exec = require('child_process').exec
cacheApiTests = require './shared/cache'

# Skip the database tests on Travis CI
# TODO: Make these work
return if environment.isTravis()

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


describe 'Shim Cache', ->
  it 'should exist', ->
    should.exist Impromptu.Cache.Shim

  describe 'Cache API', ->
    cacheApiTests Impromptu.Cache.Shim,
      fallback: 'value'


describe 'Instance Cache', ->
  it 'should exist', ->
    should.exist Impromptu.Cache.Instance

  describe 'Cache API', ->
    cacheApiTests Impromptu.Cache.Instance


describe 'Global Cache', ->
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

  it 'should exist', ->
    should.exist Impromptu.Cache.Global

  describe 'Cache API', ->
    cacheApiTests Impromptu.Cache.Global

  describe 'Run Behavior', ->
    it 'should update when background is set', (done) ->
      cached = new Impromptu.Cache.Global background, 'should-update',
        update: (fn) ->
          done()
          fn null, 'value'

      cached.run ->

    it 'should fetch globally cached values', (done) ->
      updater = new Impromptu.Cache.Global background, 'should-fetch',
        update: (fn) ->
          fn null, 'value'

      fetcher = new Impromptu.Cache.Global impromptu, 'should-fetch',
        update: (fn) ->
          should.fail 'Update should not run.'
          fn null, 'value'

      async.series [
        (fn) ->
          fetcher.run (err, fetched) ->
            should.not.exist fetched
            fn err

        (fn) ->
          updater.run (err, updated) ->
            updated.should.equal 'value'
            fn err

        (fn) ->
          fetcher.run (err, fetched) ->
            fetched.should.equal 'value'
            fn err
      ], done
