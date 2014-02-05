(function() {
  var Impromptu, Repository, async, exports, _ref,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Impromptu = require('../impromptu');

  async = require('async');

  Repository = (function(_super) {
    __extends(Repository, _super);

    function Repository() {
      _ref = Repository.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Repository.prototype.prepare = function(method, fn) {
      var parts,
        _this = this;

      if (this._prepared) {
        return Impromptu.Cache.Global.prototype[method].call(this, fn);
      }
      parts = ['root', 'branch'];
      if (this.options.commit) {
        parts.push('commit');
      }
      return async.map(parts, function(part, done) {
        return _this.impromptu.repository[part](done);
      }, function(err, results) {
        if (err) {
          return fn(err);
        }
        while (results.length && !results[results.length - 1]) {
          results.pop();
        }
        results.unshift(_this.name);
        _this.name = results.join(':');
        _this._prepared = true;
        return Impromptu.Cache.Global.prototype[method].call(_this, fn);
      });
    };

    return Repository;

  })(Impromptu.Cache.Global);

  ['run', 'get', 'set', 'unset'].forEach(function(method) {
    return Repository.prototype[method] = function(fn) {
      return this.prepare(method, fn);
    };
  });

  exports = module.exports = Repository;

}).call(this);
