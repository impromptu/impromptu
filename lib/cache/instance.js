var Cache = require('./base')
var util = require('util')

/**
 * @constructor
 * @extends {Impromptu.Cache.Base}
 */
function Instance() {
  Cache.apply(this, arguments)
}
util.inherits(Instance, Cache)

Instance.prototype.run = function(fn) {
  // Return the cached value if possible.
  if (!this._cached || this._needsRefresh) {
    this._setThenGet(fn)
  } else {
    this.get(fn)
  }
}

Instance.prototype.get = function(fn) {
  if (!fn) return

  var value = this._cached != null ? this._cached : this.options.fallback
  fn(null, value)
}

Instance.prototype.set = function(fn) {
  if (!this._claimSetLock(fn)) return

  this._update(function(err, value) {
    if (!err) this._cached = value
    this._releaseSetLock(err, !err)
  }.bind(this))
}

Instance.prototype.unset = function(fn) {
  this._cached = null
  if (fn) fn(null, true)
}

module.exports = Instance
