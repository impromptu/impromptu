should = require 'should'
environment = require './shared/environment'
Impromptu = require '../lib/impromptu'
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

  it 'should exist', ->
    should.exist Impromptu.Cache.Global

  describe 'Cache API', ->
    cacheTest.base Impromptu.Cache.Global

  describe 'Run Behavior', ->
    cacheTest.global Impromptu.Cache.Global


describe 'Directory Cache', ->
  impromptu = new Impromptu()

  it 'should exist', ->
    should.exist Impromptu.Cache.Directory

  it 'should have the directory in the name', ->
    name = cacheTest.name()
    cache = new Impromptu.Cache.Directory impromptu, name,
      update: (fn) ->
        fn null, 'value'

    cache.name.should.equal "#{name}:#{process.env.PWD}"

  describe 'Cache API', ->
    cacheTest.base Impromptu.Cache.Directory

  describe 'Run Behavior', ->
    cacheTest.global Impromptu.Cache.Directory


describe 'Repository Cache', ->
  impromptu = new Impromptu()

  it 'should exist', ->
    should.exist Impromptu.Cache.Repository

  it 'should have the repository root in the name', (done) ->
    name = cacheTest.name()
    cache = new Impromptu.Cache.Repository impromptu, name,
      update: (fn) ->
        fn null, 'value'

    Impromptu.Cache.Global::prepared = (done) ->
      cache.name.should.equal "#{name}:#{process.env.PWD}"
      done()

    cache.prepare 'prepared', done

  describe 'Cache API', ->
    cacheTest.base Impromptu.Cache.Repository

  describe 'Run Behavior', ->
    cacheTest.global Impromptu.Cache.Repository
