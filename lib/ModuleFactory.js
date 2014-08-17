var path = require('path')
var exec = require('child_process').exec


/**
 * @constructor
 */
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
  var cacheType = options.cache
  delete options.cache

  var cache = this.impromptu.cache.create(cacheType, this.name + ':' + key, options)
  this._methods[key] = cache.run
  return cache.run
}


/**
 * @constructor
 */
function ModuleFactory(impromptu) {
  this.impromptu = impromptu
}

// Register a new Impromptu module.
ModuleFactory.prototype.register = function(name, fn) {
  return new Module(this.impromptu, this, name, fn)._methods
}

// Require and register a new Impromptu module.
ModuleFactory.prototype.require = function(module) {
  var fn = require(this.impromptu.state.get('path.nodeModules') + '/' + module)
  if (typeof fn === 'function') {
    return this.register(path, fn)
  }
}

module.exports = ModuleFactory
