var Cache = require('./base')
var util = require('util')

// Required types.
var State = require('../state')
var DB = require('../db')
var Repository = require('../repository')

/**
 * @constructor
 * @extends {Cache}
 * @param {State} state
 * @param {DB} db
 * @param {Repository} repository
 * @param {string} name The name of the cache key.
 * @param {Object} options The options for this instance of the cache.
 */
function Instance(state, db, repository, name, options) {
  Cache.call(this, state, db, repository, name, options)
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
