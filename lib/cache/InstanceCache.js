var AbstractCache = require('./AbstractCache')
var util = require('util')

/**
 * @constructor
 * @extends {AbstractCache}
 * @param {*} impromptu
 * @param {string} name The name of the cache key.
 * @param {Object} options The options for this instance of the cache.
 */
function InstanceCache(impromptu, name, options) {
  AbstractCache.call(this, impromptu, name, options)
}
util.inherits(InstanceCache, AbstractCache)

InstanceCache.prototype.run = function(fn) {
  // Return the cached value if possible.
  if (!this._cached || this._needsRefresh) {
    this._setThenGet(fn)
  } else {
    this.get(fn)
  }
}

InstanceCache.prototype.get = function(fn) {
  if (!fn) return

  var value = this._cached != null ? this._cached : this.options.fallback
  fn(null, value)
}

InstanceCache.prototype.set = function(fn) {
  if (!this._claimSetLock(fn)) return

  this._update(function(err, value) {
    if (!err) this._cached = value
    this._releaseSetLock(err, !err)
  }.bind(this))
}

InstanceCache.prototype.unset = function(fn) {
  this._cached = null
  if (fn) fn(null, true)
}

module.exports = InstanceCache
