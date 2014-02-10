var DirectoryCache = require('./cache/directory')
var GlobalCache = require('./cache/global')
var InstanceCache = require('./cache/instance')
var RepositoryCache = require('./cache/repository')
var ShimCache = require('./cache/shim')

var path = require('path')
var exec = require('child_process').exec
var hash = require('crypto').createHash('md5')


function Plugin(impromptu, factory, name, initialize) {
  this.impromptu = impromptu
  this.factory = factory
  this.name = name
  this.register = this.register.bind(this)
  this._methods = {
    register: this.register
  }

  initialize(this._methods)
}

Plugin.prototype.register = function(key, options) {
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


function PluginFactory(impromptu) {
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

// Register a new Impromptu plugin.
PluginFactory.prototype.create = function (fn) {
  // Generate a unique name for the plugin based on the call stack.
  hash.update(new Error().stack)
  var name = hash.digest('hex')

  return new Plugin(this.impromptu, this, name, fn)._methods
}

module.exports = PluginFactory
