var should = require('should')
var environment = require('./shared/environment')
var Impromptu = require('../lib/impromptu').constructor
var async = require('async')
var cacheTest = require('./shared/cache')

// Skip the database tests on Travis CI
// TODO: Make these work
if (environment.isTravis()) {
  return
}

describe('Shim Cache', function() {
  it('should exist', function() {
    should.exist(Impromptu.Cache.ShimCache)
  })
  describe('Cache API', function() {
    cacheTest.base(Impromptu.Cache.ShimCache, {
      fallback: 'value'
    })
  })
})

describe('Instance Cache', function() {
  it('should exist', function() {
    should.exist(Impromptu.Cache.InstanceCache)
  })
  describe('Cache API', function() {
    cacheTest.base(Impromptu.Cache.InstanceCache)
  })
})

describe('Global Cache', function() {
  var impromptu = new Impromptu()
  it('should exist', function() {
    should.exist(Impromptu.Cache.GlobalCache)
  })
  describe('Cache API', function() {
    cacheTest.base(Impromptu.Cache.GlobalCache)
  })
  describe('Run Behavior', function() {
    cacheTest.global(Impromptu.Cache.GlobalCache)
  })
})

describe('Directory Cache', function() {
  var impromptu = new Impromptu()
  it('should exist', function() {
    should.exist(Impromptu.Cache.DirectoryCache)
  })
  it('should have the directory in the name', function() {
    var name = cacheTest.name()
    var cache = new Impromptu.Cache.DirectoryCache(impromptu, name, {
      update: function(fn) {
        return fn(null, 'value')
      }
    })
    cache.name.should.equal("" + name + ":" + process.env.PWD)
  })
  describe('Cache API', function() {
    cacheTest.base(Impromptu.Cache.DirectoryCache)
  })
  describe('Run Behavior', function() {
    cacheTest.global(Impromptu.Cache.DirectoryCache)
  })
})

describe('Repository Cache', function() {
  var impromptu = new Impromptu()
  it('should exist', function() {
    should.exist(Impromptu.Cache.RepositoryCache)
  })
  it('should have the repository root in the name', function(done) {
    var name = cacheTest.name()
    var cache = new Impromptu.Cache.RepositoryCache(impromptu, name, {
      update: function(fn) {
        return fn(null, 'value')
      }
    })
    Impromptu.Cache.GlobalCache.prototype.prepared = function(done) {
      cache.name.should.equal("" + name + ":" + process.env.PWD)
      done()
    }
    cache.prepare('prepared', done)
  })
  describe('Cache API', function() {
    cacheTest.base(Impromptu.Cache.RepositoryCache)
  })
  describe('Run Behavior', function() {
    cacheTest.global(Impromptu.Cache.RepositoryCache)
  })
})
