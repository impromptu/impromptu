var DB, exports,
  __slice = [].slice;

DB = (function() {
  function DB(impromptu) {
    var _this = this;

    this.impromptu = impromptu;
    this.requests = {};
    process.on('message', function(message) {
      var callback, callbacks, data, _i, _len;

      if (message.type !== 'cache:response') {
        return;
      }
      data = message.data;
      if (!(_this.requests[data.method] && _this.requests[data.method][data.uid])) {
        return;
      }
      callbacks = _this.requests[data.method][data.uid];
      for (_i = 0, _len = callbacks.length; _i < _len; _i++) {
        callback = callbacks[_i];
        callback(data.error, data.response);
      }
      return delete _this.requests[data.method][data.uid];
    });
  }

  DB.prototype.send = function(method, data, done) {
    var uid, _base, _ref;

    uid = JSON.stringify(data);
    if ((_ref = (_base = this.requests)[method]) == null) {
      _base[method] = {};
    }
    if (!this.requests[method][uid]) {
      this.requests[method][uid] = [];
      data.uid = uid;
      data.method = method;
      process.send({
        type: "cache:request",
        data: data
      });
    }
    if (done) {
      return this.requests[method][uid].push(done);
    }
  };

  DB.prototype.exists = function(key, done) {
    return this.get(key, function(err, response) {
      if (done) {
        return done(err, !!response);
      }
    });
  };

  DB.prototype.get = function(key, done) {
    return this.send('get', {
      key: key
    }, done);
  };

  DB.prototype.set = function(key, value, expire, done) {
    if (typeof expire === 'function') {
      done = expire;
      expire = 0;
    }
    return this.send('set', {
      key: key,
      value: value,
      expire: expire
    }, done);
  };

  DB.prototype.del = function() {
    var done, keys, _i;

    keys = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), done = arguments[_i++];
    if ((done != null) && typeof done !== 'function') {
      keys.push(done);
      done = null;
    }
    return this.send('del', {
      keys: keys
    }, done);
  };

  return DB;

})();

exports = module.exports = DB;

