var Impromptu = require('../impromptu')
var util = require('util')

function Instance() {
  Impromptu.Cache.apply(this, arguments)
}
util.inherits(Instance, Impromptu.Cache)

Instance.prototype.run = function(fn) {
  // Return the cached value if possible.
  if (this._cached) {
    this.get(fn);
  } else {
    this._setThenGet(fn);
  }
};

Instance.prototype.get = function(fn) {
  if (!fn) return

  var value = this._cached != null ? this._cached : this.options.fallback
  fn(null, value)
};

Instance.prototype.set = function(fn) {
  this._update(function(err, value) {
    if (!err) this._cached = value
    if (fn) fn(err, !err)
  }.bind(this));
};

Instance.prototype.unset = function(fn) {
  this._cached = null
  if (fn) fn(null, true)
};

module.exports = Instance
