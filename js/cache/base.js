// TODO: Update for style, copy comments.
var Cache, Impromptu, exports,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Impromptu = require('../impromptu');

Cache = (function() {
  function Cache(impromptu, name, options) {
    var protoRun,
      _this = this;

    this.impromptu = impromptu;
    this.name = name;
    this.options = options;
    this._setThenGet = __bind(this._setThenGet, this);
    this._update = __bind(this._update, this);
    protoRun = this.run;
    this.run = function(done) {
      if (_this.options.run) {
        return _this.options.run.apply(_this, arguments);
      } else {
        return protoRun.apply(_this, arguments);
      }
    };
  }

  Cache.prototype.run = function(fn) {
    throw Impromptu.AbstractError;
  };

  Cache.prototype.get = function(fn) {
    throw Impromptu.AbstractError;
  };

  Cache.prototype.set = function(fn) {
    throw Impromptu.AbstractError;
  };

  Cache.prototype.unset = function(fn) {
    throw Impromptu.AbstractError;
  };

  Cache.prototype._update = function(done) {
    var err, results;

    done || (done = function(err, results) {});
    if (this.options.update.length) {
      return this.options.update.call(this.options.context, done);
    }
    try {
      return results = this.options.update.call(this.options.context);
    } catch (_error) {
      err = _error;
    } finally {
      done(err, results);
    }
  };

  Cache.prototype._setThenGet = function(done) {
    var _this = this;

    return this.set(function(err, results) {
      if (err) {
        if (done) {
          return done(err);
        }
      } else {
        return _this.get(done);
      }
    });
  };

  return Cache;

})();

exports = module.exports = Cache;
