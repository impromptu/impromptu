(function() {
  var Impromptu, argv, cache, childFactory, fork, fs, impromptu, minimist, net, path, pathOrPort, server, serverId, shutdown;

  net = require('net');

  fork = require('child_process').fork;

  Impromptu = require('../lib/impromptu');

  path = require('path');

  fs = require('fs');

  minimist = require('minimist');

  argv = minimist(process.argv.slice(2), {
    defaults: {
      logfile: true,
      foreground: false
    },
    alias: {
      h: 'help',
      v: 'version'
    }
  });

  pathOrPort = argv.path || argv.port;

  serverId = argv.path ? path.basename(path.resolve(argv.path)) : argv.port;

  impromptu = new Impromptu({
    verbosity: argv.verbosity,
    serverId: serverId
  });

  impromptu.log.defaultDestinations.server = argv.foreground;

  impromptu.log.defaultDestinations.file = argv.logfile;

  cache = {
    _store: {},
    get: function(data) {
      var result;

      result = cache._store[data.key];
      if (!result) {
        return;
      }
      if (!result.expireAt || Date.now() < result.expireAt) {
        return result.value;
      } else {
        delete cache._store[data.key];
      }
    },
    set: function(data) {
      var result;

      result = {
        value: data.value
      };
      if (data.expire) {
        result.expireAt = Date.now() + data.expire * 1000;
      }
      return cache._store[data.key] = result;
    },
    del: function(data) {
      var key, _i, _len, _ref;

      _ref = data.keys;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        key = _ref[_i];
        delete cache._store[key];
      }
      return true;
    },
    listen: function(child) {
      return child.on('message', function(message) {
        var data, response;

        if (message.type !== 'cache:request') {
          return;
        }
        data = message.data;
        response = cache[data.method](data);
        return child.send({
          type: 'cache:response',
          data: {
            method: data.method,
            uid: data.uid,
            response: response
          }
        });
      });
    }
  };

  childFactory = {
    MAX_LENGTH: 2,
    _queue: [],
    _spawn: function() {
      var child;

      child = fork("" + __dirname + "/../lib/child.js", process.argv.slice(2));
      return cache.listen(child);
    },
    refresh: function() {
      var _results;

      _results = [];
      while (this._queue.length < this.MAX_LENGTH) {
        _results.push(this._queue.push(this._spawn()));
      }
      return _results;
    },
    get: function() {
      if (this._queue.length) {
        return this._queue.shift();
      } else {
        return this._spawn();
      }
    }
  };

  shutdown = function() {
    return server.close(function() {
      return process.exit();
    });
  };

  process.on('exit', function() {
    return fs.unlinkSync(impromptu.path.serverPid);
  });

  process.on('SIGINT', function() {
    return shutdown();
  });

  fs.writeFileSync(impromptu.path.serverPid, process.pid);

  childFactory.refresh();

  server = net.createServer({
    allowHalfOpen: true
  }, function(socket) {
    var body, npmConfig, npmConfigPath;

    npmConfigPath = path.resolve("" + __dirname + "/../package.json");
    npmConfig = JSON.parse(fs.readFileSync(npmConfigPath));
    if (Impromptu.VERSION !== npmConfig.version) {
      socket.end();
      shutdown();
      return;
    }
    body = '';
    socket.on('data', function(data) {
      body += data;
      if (body.length > 1e6) {
        body = '';
        socket.end();
        return socket.destroy();
      }
    });
    return socket.on('end', function() {
      var child;

      if (body === 'shutdown') {
        socket.end();
        shutdown();
        return;
      }
      child = childFactory.get();
      child.on('message', function(message) {
        if (message.type === 'write') {
          return socket.write(message.data);
        } else if (message.type === 'end') {
          socket.end(message.data);
          return childFactory.refresh();
        }
      });
      if (body === 'test') {
        child.send({
          type: 'test'
        });
        return child.on('message', function(message) {
          if (message.type === 'shutdown') {
            shutdown();
            return socket.end();
          }
        });
      } else {
        return child.send({
          type: 'env',
          data: body
        });
      }
    });
  });

  server.listen(pathOrPort);

}).call(this);
