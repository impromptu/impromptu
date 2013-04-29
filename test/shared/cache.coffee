should = require 'should'
Impromptu = require '../../src/impromptu'
async = require 'async'

class CacheTests
  constructor: (@CacheClass, @impromptu, @name) ->
    @instance = new CacheClass @impromptu, @name,
      update: (fn) ->
        fn null, 'value'


  getShouldFail: (fn) ->
    @instance.get (err, result) ->
      should.not.exist result
      fn err


  getShouldPass: (fn) ->
    @instance.get (err, result) ->
      result.should.equal 'value'
      fn err


  setShouldPass: (fn) ->
    @instance.set (err, result) ->
      result.should.equal true
      fn err


  unsetShouldPass: (fn) ->
    @instance.unset (err, result) ->
      result.should.equal true
      fn err


exports = module.exports = (CacheClass) ->
  impromptu = new Impromptu
  counter = 0
  cache = null

  beforeEach ->
    cache = new CacheTests CacheClass, impromptu, "impromptu-cache-api-test-#{counter++}"

  it 'should create an instance', ->
    should.exist cache

  it 'should be empty by default', (done) ->
    cache.getShouldFail done

  it 'should set a value', (done) ->
    async.series [
      (fn) -> cache.getShouldFail fn
      (fn) -> cache.setShouldPass fn
      (fn) -> cache.getShouldPass fn
    ], done

  it 'should unset a value', (done) ->
    async.series [
      (fn) -> cache.getShouldFail fn
      (fn) -> cache.setShouldPass fn
      (fn) -> cache.getShouldPass fn
      (fn) -> cache.unsetShouldPass fn
      (fn) -> cache.getShouldFail fn
    ], done
