// TODO: Update for style, copy comments.
var Impromptu, Shim, exports, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Impromptu = require('../impromptu');

Shim = (function(_super) {
  __extends(Shim, _super);

  function Shim() {
    _ref = Shim.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Shim.prototype.run = function(fn) {
    return this.get(fn);
  };

  Shim.prototype.get = function(fn) {
    return this._update(fn);
  };

  Shim.prototype.set = function(fn) {
    return this.get(function(err, value) {
      if (fn) {
        return fn(err, !err);
      }
    });
  };

  Shim.prototype.unset = function(fn) {
    if (fn) {
      return fn(null, true);
    }
  };

  return Shim;

})(Impromptu.Cache);

exports = module.exports = Shim;
