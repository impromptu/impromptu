var Impromptu, Instance, exports, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Impromptu = require('../impromptu');

Instance = (function(_super) {
  __extends(Instance, _super);

  function Instance() {
    _ref = Instance.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  Instance.prototype.run = function(fn) {
    if (this._cached) {
      return this.get(fn);
    } else {
      return this._setThenGet(fn);
    }
  };

  Instance.prototype.get = function(fn) {
    var _ref1;

    if (fn) {
      return fn(null, (_ref1 = this._cached) != null ? _ref1 : this.options.fallback);
    }
  };

  Instance.prototype.set = function(fn) {
    var _this = this;

    return this._update(function(err, value) {
      if (!err) {
        _this._cached = value;
      }
      if (fn) {
        return fn(err, !err);
      }
    });
  };

  Instance.prototype.unset = function(fn) {
    this._cached = null;
    if (fn) {
      return fn(null, true);
    }
  };

  return Instance;

})(Impromptu.Cache);

exports = module.exports = Instance;
