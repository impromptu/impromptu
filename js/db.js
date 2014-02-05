var slice = Array.prototype.slice;

function DB(impromptu) {
  this.impromptu = impromptu;
  this.requests = {};
  process.on('message', function(message) {
    if (message.type !== 'cache:response') {
      return;
    }

    var data = message.data;
    // The requests for this UID may not exist because there can be multiple
    // instances of Impromptu.
    if (!(this.requests[data.method] && this.requests[data.method][data.uid])) {
      return;
    }

    var callbacks = this.requests[data.method][data.uid];
    for (var i = 0; i < callbacks.length; i++) {
      var callback = callbacks[i];
      callback(data.error, data.response);
    }

    delete this.requests[data.method][data.uid];
  }.bind(this));
}

DB.prototype.send = function(method, data, done) {
  if (!this.requests[method]) this.requests[method] = {};

  // Only send a request when there are no outstanding requests.
  var uid = JSON.stringify(data);
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
    this.requests[method][uid].push(done);
  }
};

DB.prototype.exists = function(key, done) {
  this.get(key, function(err, response) {
    if (done) done(err, !!response);
  });
};

DB.prototype.get = function(key, done) {
  this.send('get', {
    key: key
  }, done);
};

DB.prototype.set = function(key, value, expire, done) {
  // If we only have three arguments, don't pass an expiry value.
  if (typeof expire === 'function') {
    done = expire;
    expire = 0;
  }

  this.send('set', {
    key: key,
    value: value,
    expire: expire
  }, done);
};

/* del(keys..., done) */
DB.prototype.del = function() {
  var keys = Array.prototype.slice.call(arguments)
  var done = keys.pop()

  if ((done != null) && typeof done !== 'function') {
    keys.push(done);
    done = null;
  }
  this.send('del', {
    keys: keys
  }, done);
};

module.exports = DB;
