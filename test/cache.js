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
    cacheTest.base('shim', {
      fallback: 'value'
    })
  })
})

describe('Instance Cache', function() {
  it('should exist', function() {
    should.exist(Impromptu.Cache.InstanceCache)
  })
  describe('Cache API', function() {
    cacheTest.base('instance')
  })
})

describe('Global Cache', function() {
  var impromptu = new Impromptu()
  it('should exist', function() {
    should.exist(Impromptu.Cache.GlobalCache)
  })
  describe('Cache API', function() {
    cacheTest.base('global')
  })
  describe('Run Behavior', function() {
    cacheTest.global('global')
  })
})

describe('Directory Cache', function() {
  var impromptu = new Impromptu()
  it('should exist', function() {
    should.exist(Impromptu.Cache.DirectoryCache)
  })
  it('should have the directory in the name', function() {
    var name = cacheTest.name()
    var cache = impromptu.cache.create('directory', name, {
      update: function(fn) {
        return fn(null, 'value')
      }
    })
    cache.name.should.equal("" + name + ":" + process.env.PWD)
  })
  describe('Cache API', function() {
    cacheTest.base('directory')
  })
  describe('Run Behavior', function() {
    cacheTest.global('directory')
  })
})

describe('Repository Cache', function() {
  var impromptu = new Impromptu()
  it('should exist', function() {
    should.exist(Impromptu.Cache.RepositoryCache)
  })
  it('should have the repository root in the name', function(done) {
    var name = cacheTest.name()
    var cache = impromptu.cache.create('repository', name, {
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
    cacheTest.base('repository')
  })
  describe('Run Behavior', function() {
    cacheTest.global('repository')
  })
})
