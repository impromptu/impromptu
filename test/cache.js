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
    should.exist(Impromptu.Cache.Shim)
  })
  describe('Cache API', function() {
    cacheTest.base(Impromptu.Cache.Shim, {
      fallback: 'value'
    })
  })
})

describe('Instance Cache', function() {
  it('should exist', function() {
    should.exist(Impromptu.Cache.Instance)
  })
  describe('Cache API', function() {
    cacheTest.base(Impromptu.Cache.Instance)
  })
})

describe('Global Cache', function() {
  var impromptu = new Impromptu()
  it('should exist', function() {
    should.exist(Impromptu.Cache.Global)
  })
  describe('Cache API', function() {
    cacheTest.base(Impromptu.Cache.Global)
  })
  describe('Run Behavior', function() {
    cacheTest.global(Impromptu.Cache.Global)
  })
})

describe('Directory Cache', function() {
  var impromptu = new Impromptu()
  it('should exist', function() {
    should.exist(Impromptu.Cache.Directory)
  })
  it('should have the directory in the name', function() {
    var name = cacheTest.name()
    var cache = new Impromptu.Cache.Directory(impromptu, name, {
      update: function(fn) {
        return fn(null, 'value')
      }
    })
    cache.name.should.equal("" + name + ":" + process.env.PWD)
  })
  describe('Cache API', function() {
    cacheTest.base(Impromptu.Cache.Directory)
  })
  describe('Run Behavior', function() {
    cacheTest.global(Impromptu.Cache.Directory)
  })
})

describe('Repository Cache', function() {
  var impromptu = new Impromptu()
  it('should exist', function() {
    should.exist(Impromptu.Cache.Repository)
  })
  it('should have the repository root in the name', function(done) {
    var name = cacheTest.name()
    var cache = new Impromptu.Cache.Repository(impromptu, name, {
      update: function(fn) {
        return fn(null, 'value')
      }
    })
    Impromptu.Cache.Global.prototype.prepared = function(done) {
      cache.name.should.equal("" + name + ":" + process.env.PWD)
      done()
    }
    cache.prepare('prepared', done)
  })
  describe('Cache API', function() {
    cacheTest.base(Impromptu.Cache.Repository)
  })
  describe('Run Behavior', function() {
    cacheTest.global(Impromptu.Cache.Repository)
  })
})
