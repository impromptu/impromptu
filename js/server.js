var net = require('net');
var fork = require('child_process').fork;
var Impromptu = require('../lib/impromptu');
var path = require('path');
var fs = require('fs');
var minimist = require('minimist');

var argv = minimist(process.argv.slice(2), {
  defaults: {
    logfile: true,
    foreground: false
  },
  alias: {
    h: 'help',
    v: 'version'
  }
});

// If you use a Unix Domain Socket, its filename must be unique.
var pathOrPort = argv.path || argv.port;
var serverId = argv.path ? path.basename(path.resolve(argv.path)) : argv.port;

var impromptu = new Impromptu({
  verbosity: argv.verbosity,
  serverId: serverId
});

impromptu.log.defaultDestinations.server = argv.foreground;

impromptu.log.defaultDestinations.file = argv.logfile;

var cache = {
  _store: {},
  get: function(data) {
    var result = cache._store[data.key];
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
    var result = {value: data.value};

    if (data.expire) {
      result.expireAt = Date.now() + data.expire * 1000;
    }
    cache._store[data.key] = result;
  },
  del: function(data) {
    for (var i = 0; i < data.keys.length; i++) {
      var key = data.keys[i];
      delete cache._store[key];
    }

    // TODO: Is this necessary?
    return true;
  },
  listen: function(child) {
    return child.on('message', function(message) {
      if (message.type !== 'cache:request') {
        return;
      }
      var data = message.data;
      var response = cache[data.method](data);
      child.send({
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

var childFactory = {
  MAX_LENGTH: 2,
  _queue: [],
  _spawn: function() {
    var child = fork("" + __dirname + "/../lib/child.js", process.argv.slice(2));
    cache.listen(child)
    return child
  },
  refresh: function() {
    while (this._queue.length < this.MAX_LENGTH) {
      this._queue.push(this._spawn());
    }
  },
  get: function() {
    if (this._queue.length) {
      return this._queue.shift();
    } else {
      return this._spawn();
    }
  }
};

// Safely shut down the server.
var shutdown = function() {
  return server.close(function() {
    return process.exit();
  });
};

// Clean up after ourselves before the process exits.
process.on('exit', function() {
  // Remove the Impromptu server's pid file.
  fs.unlinkSync(impromptu.path.serverPid);
  // TODO: If the server is using a Unix domain socket, remove the socket file here.
});

// Gracefully shut down on Ctrl+C.
process.on('SIGINT', function() {
  shutdown();
});

// Prepare to create the server.
// -----------------------------

// Write the server's PID to a file.
fs.writeFileSync(impromptu.path.serverPid, process.pid);

// Build the queue of child processes.
childFactory.refresh();

// Create the server.
var server = net.createServer({
  allowHalfOpen: true
}, function(socket) {
  // Verify that the client is running on the same version as the server.
  var npmConfigPath = path.resolve("" + __dirname + "/../package.json");
  var npmConfig = JSON.parse(fs.readFileSync(npmConfigPath));

  // If there's a version mismatch, stop running the server.
  if (Impromptu.VERSION !== npmConfig.version) {
    socket.end();
    shutdown();
    return;
  }

  // Build the body.
  // The body can be:
  // * A newline delimited representation of the shell environment (as formatted
  //   by printenv: each line is equal to "KEY=value").
  // * The string 'shutdown'.
  var body = '';
  socket.on('data', function(data) {
    body += data;

    // Make sure the server isn't being flooded.
    if (body.length > 1e6) {
      body = '';
      socket.end();
      socket.destroy();
    }
  });
  socket.on('end', function() {
    var child;

    if (body === 'shutdown') {
      socket.end();
      shutdown();
      return;
    }
    child = childFactory.get();

    // Bind message listeners that use the socket.
    child.on('message', function(message) {
      if (message.type === 'write') {
        return socket.write(message.data);
      } else if (message.type === 'end') {
        socket.end(message.data);
        // TODO: Call this when the child has exited (or disconnect from the
        // child at this point, and create a different system to handle any orphaned
        // or long-running background refreshes).
        childFactory.refresh();
      }
    });

    if (body === 'test') {
      child.send({
        type: 'test'
      });

      child.on('message', function(message) {
        if (message.type === 'shutdown') {
          shutdown();
          socket.end();
        }
      });

    } else {
      child.send({
        type: 'env',
        data: body
      });
    }
  });
});

server.listen(pathOrPort);
