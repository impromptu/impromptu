should = require 'should'
environment = require './shared/environment'
Impromptu = require '../src/impromptu'
async = require 'async'
cacheApiTests = require './shared/cache'

# Skip the database tests on Travis CI
# TODO: Make these work
return if environment.isTravis()


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
