var Impromptu = require('../impromptu')
var util = require('util')

/**
 * A shim that runs a function in the context of Impromptu's caching interface.
 * Does NOT cache the result!
 */
function Shim() {
  Impromptu.Cache.apply(this, arguments)
}
util.inherits(Shim, Impromptu.Cache)

Shim.prototype.run = function(fn) {
  this.get(fn)
}

Shim.prototype.get = function(fn) {
  this._update(fn)
}

Shim.prototype.set = function(fn) {
  this.get(function(err, value) {
    if (fn) fn(err, !err)
  })
}

Shim.prototype.unset = function(fn) {
  if (fn) fn(null, true)
}

module.exports = Shim
