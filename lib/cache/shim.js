var Cache = require('./base')
var util = require('util')

// Required types.
var State = require('../state')
var DB = require('../db')
var Repository = require('../repository')

/**
 * A shim that runs a function in the context of Impromptu's caching interface.
 * Does NOT cache the result!
 * @constructor
 * @extends {Cache}
 * @param {State} state
 * @param {DB} db
 * @param {Repository} repository
 * @param {string} name The name of the cache key.
 * @param {Object} options The options for this instance of the cache.
 */
function Shim(state, db, repository, name, options) {
  this._callbacks = []
  Cache.call(this, state, db, repository, name, options)
}
util.inherits(Shim, Cache)

Shim.prototype.run = function(fn) {
  this.get(fn)
}

Shim.prototype.get = function(fn) {
  if (fn) this._callbacks.push(fn)
  this._set()
}

Shim.prototype.set = function(fn) {
  if (fn) this._callbacks.push(function (err) { fn(err, !err) })
  this._set()
}

Shim.prototype._set = function() {
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

Shim.prototype.unset = function(fn) {
  if (fn) fn(null, true)
}

module.exports = Shim
