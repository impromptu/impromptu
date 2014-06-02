var Cache = require('./base')
var util = require('util')

/**
 * A shim that runs a function in the context of Impromptu's caching interface.
 * Does NOT cache the result!
 * @constructor
 * @extends {Cache}
 */
function Shim() {
  this._callbacks = []
  Cache.apply(this, arguments)
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
