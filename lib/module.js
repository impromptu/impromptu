var DirectoryCache = require('./cache/directory')
var GlobalCache = require('./cache/global')
var InstanceCache = require('./cache/instance')
var RepositoryCache = require('./cache/repository')
var ShimCache = require('./cache/shim')

var path = require('path')
var exec = require('child_process').exec


function Module(impromptu, factory, name, initialize) {
  this.impromptu = impromptu
  this.factory = factory
  this.name = name
  this.register = this.register.bind(this)
  this._methods = {}

  // TODO: Remove reliance on the constructor. This remains here for backwards compatibility.
  var Impromptu = impromptu.constructor
  initialize.call(this.impromptu, Impromptu, this.register, this._methods)
}

Module.prototype.register = function(key, options) {
  // Cache responses using the instance cache by default.
  if (typeof options.cache === 'undefined' || options.cache === true) {
    options.cache = 'instance'
  }

  // If cache is specifically passed a falsy value, use a cache shim.
  // This won't cache the value, it just creates a consistent API.
  if (!options.cache) options.cache = 'shim'

  // Set the impromptu instance as the context by default.
  if (!options.context) options.context = this.impromptu

  var Cache = this.factory.cache[options.cache] || this.factory.cache.instance
  var cache = new Cache(this.impromptu, "" + this.name + ":" + key, options)
  this._methods[key] = cache.run
  return cache.run
}


function ModuleFactory(impromptu) {
  this.impromptu = impromptu

  // A map between caching keys and cache constructors.
  this.cache = {
    directory: DirectoryCache,
    global: GlobalCache,
    instance: InstanceCache,
    repository: RepositoryCache,
    shim: ShimCache
  }
}

// Register a new Impromptu module.
ModuleFactory.prototype.register = function(name, fn) {
  return new Module(this.impromptu, this, name, fn)._methods
}

// Require and register a new Impromptu module.
ModuleFactory.prototype.require = function(module) {
  var fn = require(this.impromptu.path('nodeModules') + '/' + module)
  if (typeof fn === 'function') {
    return this.register(path, fn)
  }
}

module.exports = ModuleFactory
