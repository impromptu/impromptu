should = require 'should'
environment = require './shared/environment'
Impromptu = require '../src/impromptu'
async = require 'async'
cacheTest = require './shared/cache'

# Skip the database tests on Travis CI
# TODO: Make these work
return if environment.isTravis()


describe 'Shim Cache', ->
  it 'should exist', ->
    should.exist Impromptu.Cache.Shim

  describe 'Cache API', ->
    cacheTest.base Impromptu.Cache.Shim,
      fallback: 'value'


describe 'Instance Cache', ->
  it 'should exist', ->
    should.exist Impromptu.Cache.Instance

  describe 'Cache API', ->
    cacheTest.base Impromptu.Cache.Instance


describe 'Global Cache', ->
  impromptu = new Impromptu()

  before (done) ->
    async.series [
      (fn) ->
        impromptu.db.client().on 'connect', fn
      (fn) ->
        impromptu.db.client().flushdb fn
    ], done

  it 'should exist', ->
    should.exist Impromptu.Cache.Global

  describe 'Cache API', ->
    cacheTest.base Impromptu.Cache.Global

  describe 'Run Behavior', ->
    cacheTest.global Impromptu.Cache.Global



describe 'Directory Cache', ->
  it 'should exist', ->
    should.exist Impromptu.Cache.Directory

  describe 'Cache API', ->
    cacheTest.base Impromptu.Cache.Directory

  describe 'Run Behavior', ->
    cacheTest.global Impromptu.Cache.Directory
