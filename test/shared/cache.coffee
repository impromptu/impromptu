should = require 'should'
Impromptu = require '../../src/impromptu'
async = require 'async'
_ = require 'underscore'

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

test = {}

test.base = (CacheClass, options = {}) ->
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

  it 'should set a value synchronously', (done) ->
    optionsSync = _.clone options
    optionsSync.update = -> 'value'
    cacheSync = new CacheTests CacheClass, optionsSync, impromptu, "impromptu-cache-api-test-#{counter++}"

    async.series [
      (fn) -> cacheSync.getShouldEqualFallback fn
      (fn) -> cacheSync.setShouldPass fn
      (fn) -> cacheSync.getShouldPass fn
    ], done

  it 'should unset a value', (done) ->
    async.series [
      (fn) -> cache.getShouldEqualFallback fn
      (fn) -> cache.setShouldPass fn
      (fn) -> cache.getShouldPass fn
      (fn) -> cache.unsetShouldPass fn
      (fn) -> cache.getShouldEqualFallback fn
    ], done


test.global = (CacheClass, options = {}) ->
  impromptu = new Impromptu()
  background = new Impromptu
    background: true

  it 'should update when background is set', (done) ->
    cached = new CacheClass background, 'should-update',
      update: (fn) ->
        done()
        fn null, 'value'

    cached.run ->

  it 'should fetch cached values', (done) ->
    updater = new CacheClass background, 'should-fetch',
      update: (fn) ->
        fn null, 'value'

    fetcher = new CacheClass impromptu, 'should-fetch',
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

exports = module.exports = test
