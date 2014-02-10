should = require 'should'
Impromptu = require('../../lib/impromptu').constructor
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
    @instance.set (err, success) ->
      success.should.equal true
      fn err


  unsetShouldPass: (fn) =>
    @instance.unset (err, success) ->
      success.should.equal true
      fn err

test =
  counter: 0
  name: ->
    "impromptu-cache-test-#{test.counter++}"

test.base = (CacheClass, options = {}) ->
  impromptu = new Impromptu()
  cache = null

  beforeEach ->
    cache = new CacheTests CacheClass, options, impromptu, test.name()

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
    cacheSync = new CacheTests CacheClass, optionsSync, impromptu, test.name()

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

  it 'should call get without a callback', ->
    cache.instance.get()

  it 'should call set without a callback', ->
    cache.instance.set()

  it 'should call unset without a callback', ->
    cache.instance.unset()

  it 'should call run without a callback', ->
    cache.instance.run()

  it 'should handle multiple cache sets with a single request', (done) ->
    called = false
    raceSafeCache = new CacheClass impromptu, test.name(),
      update: (fn) ->
        called.should.equal false
        called = true
        setTimeout ->
          fn null, 'value'
        , 20

    async.series [
      (fn) ->
        impromptu.refresh()
        async.parallel [
          (complete) ->
            raceSafeCache.run (err, updated) ->
              updated.should.equal 'value'
              complete err

          (complete) ->
            raceSafeCache.run (err, updated) ->
              updated.should.equal 'value'
              complete err
        ], fn
    ], done


  it 'should update when needs refresh is set', (done) ->
    called = false
    refreshableCache = new CacheClass impromptu, test.name(),
      update: (fn) ->
        called.should.equal false
        called = true
        fn null, 'value'

    refreshableCache.run ->
      called = false
      impromptu.refresh()
      refreshableCache.run done




test.global = (CacheClass, options = {}) ->
  impromptu = new Impromptu()
  refreshable = new Impromptu()

  it 'should fetch cached values', (done) ->
    name = test.name()
    updater = new CacheClass refreshable, name,
      update: (fn) ->
        fn null, 'value'

    fetcher = new CacheClass impromptu, name,
      update: (fn) ->
        should.fail 'Update should not run.'
        fn null, 'value'

    async.series [
      (fn) ->
        fetcher.run (err, fetched) ->
          should.not.exist fetched
          fn err

      (fn) ->
        refreshable.refresh()
        updater.run (err, updated) ->
          updated.should.equal 'value'
          fn err

      (fn) ->
        fetcher.run (err, fetched) ->
          fetched.should.equal 'value'
          fn err
    ], done


exports = module.exports = test
