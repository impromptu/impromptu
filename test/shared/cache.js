var should = require('should')
var Impromptu = require('../../lib/impromptu').constructor
var async = require('async')

var _ = require('underscore')

function CacheTests(cacheType, options, impromptu, name) {
  this.options = options != null ? options : {}
  this.impromptu = impromptu
  this.name = name
  this.unsetShouldPass = this.unsetShouldPass.bind(this)
  this.setShouldPass = this.setShouldPass.bind(this)
  this.getShouldPass = this.getShouldPass.bind(this)
  this.getShouldEqualFallback = this.getShouldEqualFallback.bind(this)
  this.options.fallback = this.options.fallback || 'fallback'
  this.options.update = this.options.update || function(fn) {
    return fn(null, 'value')
  }

  this.instance = impromptu.cache.create(cacheType, this.name, this.options)
}

CacheTests.prototype.getShouldEqualFallback = function(fn) {
  this.instance.get(function(err, result) {
    result.should.equal(this.options.fallback)
    fn(err)
  }.bind(this))
}

CacheTests.prototype.getShouldPass = function(fn) {
  this.instance.get(function(err, result) {
    result.should.equal('value')
    fn(err)
  })
}

CacheTests.prototype.setShouldPass = function(fn) {
  this.instance.set(function(err, success) {
    success.should.equal(true)
    fn(err)
  })
}

CacheTests.prototype.unsetShouldPass = function(fn) {
  this.instance.unset(function(err, success) {
    success.should.equal(true)
    fn(err)
  })
}

test = {
  counter: 0,
  name: function() {
    return "impromptu-cache-test-" + (test.counter++)
  }
}

test.base = function(cacheType, options) {
  options = options || {}
  var impromptu = new Impromptu()
  var cache = null
  beforeEach(function() {
    cache = new CacheTests(cacheType, options, impromptu, test.name())
  })
  it('should create an instance', function() {
    should.exist(cache)
  })
  it('should equal fallback by default', function(done) {
    cache.getShouldEqualFallback(done)
  })
  it('should set a value', function(done) {
    async.series([
      function(fn) {
        cache.getShouldEqualFallback(fn)
      }, function(fn) {
        cache.setShouldPass(fn)
      }, function(fn) {
        cache.getShouldPass(fn)
      }
    ], done)
  })
  it('should set a value synchronously', function(done) {
    var optionsSync = _.clone(options)
    optionsSync.update = function() {
      return 'value'
    }
    var cacheSync = new CacheTests(cacheType, optionsSync, impromptu, test.name())
    return async.series([
      function(fn) {
        cacheSync.getShouldEqualFallback(fn)
      }, function(fn) {
        cacheSync.setShouldPass(fn)
      }, function(fn) {
        cacheSync.getShouldPass(fn)
      }
    ], done)
  })
  it('should unset a value', function(done) {
    async.series([
      function(fn) {
        cache.getShouldEqualFallback(fn)
      }, function(fn) {
        cache.setShouldPass(fn)
      }, function(fn) {
        cache.getShouldPass(fn)
      }, function(fn) {
        cache.unsetShouldPass(fn)
      }, function(fn) {
        cache.getShouldEqualFallback(fn)
      }
    ], done)
  })
  it('should call get without a callback', function() {
    cache.instance.get()
  })
  it('should call set without a callback', function() {
    cache.instance.set()
  })
  it('should call unset without a callback', function() {
    cache.instance.unset()
  })
  it('should call run without a callback', function() {
    cache.instance.run()
  })
  it('should handle multiple cache sets with a single request', function(done) {
    var called = false
    var raceSafeCache = impromptu.cache.create(cacheType, test.name(), {
      update: function(fn) {
        called.should.equal(false)
        called = true
        setTimeout(function() {
          fn(null, 'value')
        }, 20)
      }
    })
    async.series([
      function(fn) {
        impromptu.state.set('refreshCache', true)
        async.parallel([
          function(complete) {
            raceSafeCache.run(function(err, updated) {
              updated.should.equal('value')
              complete(err)
            })
          }, function(complete) {
            raceSafeCache.run(function(err, updated) {
              updated.should.equal('value')
              complete(err)
            })
          }
        ], fn)
      }
    ], done)
  })
  it('should update when needs refresh is set', function(done) {
    var called = false
    var refreshableCache = impromptu.cache.create(cacheType, test.name(), {
      update: function(fn) {
        called.should.equal(false)
        called = true
        return fn(null, 'value')
      }
    })
    refreshableCache.run(function() {
      called = false
      impromptu.state.set('refreshCache', true)
      refreshableCache.run(done)
    })
  })
}

test.global = function(cacheType, options) {
  options = options || {}
  var impromptu = new Impromptu()
  var refreshable = new Impromptu()
  it('should fetch cached values', function(done) {
    var name = test.name()
    var updater = refreshable.cache.create(cacheType, name, {
      update: function(fn) {
        return fn(null, 'value')
      }
    })
    var fetcher = impromptu.cache.create(cacheType, name, {
      update: function(fn) {
        should.fail('Update should not run.')
        return fn(null, 'value')
      }
    })
    async.series([
      function(fn) {
        fetcher.run(function(err, fetched) {
          should.not.exist(fetched)
          fn(err)
        })
      }, function(fn) {
        refreshable.state.set('refreshCache', true)
        updater.run(function(err, updated) {
          updated.should.equal('value')
          fn(err)
        })
      }, function(fn) {
        fetcher.run(function(err, fetched) {
          fetched.should.equal('value')
          fn(err)
        })
      }
    ], done)
  })
}

module.exports = test
