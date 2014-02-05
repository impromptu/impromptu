(function() {
  var CacheError, Global, Impromptu, async, exec, exports, processIsRunning, _ref, _ref1,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Impromptu = require('../impromptu');

  async = require('async');

  exec = require('child_process').exec;

  CacheError = (function(_super) {
    __extends(CacheError, _super);

    function CacheError() {
      _ref = CacheError.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    return CacheError;

  })(Impromptu.Error);

  processIsRunning = function(pid) {
    var ersch;

    try {
      process.kill(pid, 0);
    } catch (_error) {
      ersch = _error;
      return false;
    }
    return true;
  };

  Global = (function(_super) {
    __extends(Global, _super);

    function Global() {
      _ref1 = Global.__super__.constructor.apply(this, arguments);
      return _ref1;
    }

    Global.Error = CacheError;

    Global.prototype.client = function() {
      return this.impromptu.db;
    };

    Global.prototype.run = function(fn) {
      if (this.impromptu.options.refresh) {
        return this._setThenGet(fn);
      } else {
        return this.get(fn);
      }
    };

    Global.prototype.unset = function(fn) {
      return this.client().del(this.name, "lock:" + this.name, "lock-process:" + this.name, function(err, results) {
        if (fn) {
          return fn(err, !!results);
        }
      });
    };

    Global.prototype.get = function(fn) {
      var fallback;

      fallback = this.options.fallback;
      return this.client().get(this.name, function(err, results) {
        if (results == null) {
          results = fallback;
        }
        if (fn) {
          return fn(err, results);
        }
      });
    };

    Global.prototype.set = function(fn) {
      var client, name, options, update;

      client = this.client();
      name = this.name;
      options = this.options;
      update = this._update;
      return async.waterfall([
        function(done) {
          return client.exists("lock:" + name, done);
        }, function(exists, done) {
          if (exists) {
            return done(new CacheError('The cache is currently locked.'));
          }
          return client.get("lock-process:" + name, done);
        }, function(pid, done) {
          if (pid && processIsRunning(pid)) {
            return done(new CacheError('A process is currently updating the cache.'));
          }
          return client.set("lock-process:" + name, process.pid, done);
        }, function(locked, done) {
          return update(function(err, value) {
            if (err) {
              return done(err);
            }
            return async.parallel([
              function(fin) {
                return client.set(name, value.toString(), fin);
              }, function(fin) {
                if (!options.expire) {
                  return fin();
                }
                return client.set("lock:" + name, true, options.expire, fin);
              }
            ], function(err) {
              if (err) {
                done(err);
              }
              return client.del("lock-process:" + name, done);
            });
          });
        }
      ], function(err, results) {
        if (fn) {
          return fn(err, results && !err);
        }
      });
    };

    return Global;

  })(Impromptu.Cache);

  exports = module.exports = Global;

}).call(this);
