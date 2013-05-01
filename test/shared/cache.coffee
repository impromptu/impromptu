should = require 'should'
Impromptu = require '../../src/impromptu'
async = require 'async'

class CacheTests
  constructor: (@CacheClass, @options = {}, @impromptu, @name) ->
    @options.fallback ?= 'fallback'
    @options.update ?= (fn) ->
        fn null, 'value'

    @instance = new CacheClass @impromptu, @name, @options


  getShouldEqualFallback: (fn) =>
    @instance.get (err, result) =>
      result.should.equal @options.fallback
      fn err


  getShouldPass: (fn) =>
    @instance.get (err, result) ->
      result.should.equal 'value'
      fn err


  setShouldPass: (fn) =>
    @instance.set (err, result) ->
      result.should.equal true
      fn err


  unsetShouldPass: (fn) =>
    @instance.unset (err, result) ->
      result.should.equal true
      fn err


exports = module.exports = (CacheClass, options) ->
  impromptu = new Impromptu
  counter = 0
  cache = null

  beforeEach ->
    cache = new CacheTests CacheClass, options, impromptu, "impromptu-cache-api-test-#{counter++}"

  it 'should create an instance', ->
    should.exist cache

  it 'should equal fallback by default', (done) ->
    cache.getShouldEqualFallback done

  it 'should set a value', (done) ->
    async.series [
      (fn) -> cache.getShouldEqualFallback fn
      (fn) -> cache.setShouldPass fn
      (fn) -> cache.getShouldPass fn
    ], done

  it 'should unset a value', (done) ->
    async.series [
      (fn) -> cache.getShouldEqualFallback fn
      (fn) -> cache.setShouldPass fn
      (fn) -> cache.getShouldPass fn
      (fn) -> cache.unsetShouldPass fn
      (fn) -> cache.getShouldEqualFallback fn
    ], done
