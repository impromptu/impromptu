var AbstractCache = require('./AbstractCache')
var util = require('util')

// Required for type checking.
var State = require('../State')

/**
 * A shim that runs a function in the context of Impromptu's caching interface.
 * Does NOT cache the result!
 * @constructor
 * @extends {AbstractCache}
 * @param {State} state
 * @param {string} name The name of the cache key.
 * @param {Object} options The options for this instance of the cache.
 */
function ShimCache(state, name, options) {
  this._callbacks = []
  AbstractCache.call(this, state, name, options)
}
util.inherits(ShimCache, AbstractCache)

ShimCache.prototype.run = function(fn) {
  this.get(fn)
}

ShimCache.prototype.get = function(fn) {
  if (fn) this._callbacks.push(fn)
  this._set()
}

ShimCache.prototype.set = function(fn) {
  if (fn) this._callbacks.push(function (err) { fn(err, !err) })
  this._set()
}

ShimCache.prototype._set = function() {
  if (!this._claimSetLock()) return

  this._update(function(err, value) {
    // Copy the callbacks array to prevent race conditions where callbacks mutate the array.
    var callbacks = this._callbacks.slice()
    this._callbacks.length = 0
    this._releaseSetLock(err, !err)

    callbacks.forEach(function (callback) {
      callback(err, value)
    })
  }.bind(this))
}

ShimCache.prototype.unset = function(fn) {
  if (fn) fn(null, true)
}

module.exports = ShimCache
