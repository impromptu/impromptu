var net = require('net')
var fork = require('child_process').fork
var impromptu = require('../lib/impromptu')
var path = require('path')
var fs = require('fs')
var minimist = require('minimist')

var dtp = require('dtrace-provider').createDTraceProvider('impromptu')
dtp.addProbe('socket-connect', 'int')
dtp.addProbe('socket-end', 'int')
dtp.enable()

var argv = minimist(process.argv.slice(2), {
  defaults: {
    logfile: true,
    foreground: false
  },
  alias: {
    h: 'help',
    v: 'version'
  }
})

// If you use a Unix Domain Socket, its filename must be unique.
var pathOrPort = argv.path || argv.port
var serverId = argv.path ? path.basename(path.resolve(argv.path)) : argv.port

impromptu.state.set('verbosity', argv.verbosity)
impromptu.state.set('serverId', serverId)

impromptu.log.defaultDestinations.server = argv.foreground
impromptu.log.defaultDestinations.file = argv.logfile

var cache = {
  _store: {},
  get: function(data) {
    var result = cache._store[data.key]
    if (!result) {
      return
    }
    if (!result.expireAt || Date.now() < result.expireAt) {
      return result.value
    } else {
      delete cache._store[data.key]
    }
  },
  set: function(data) {
    var result = {value: data.value}

    if (data.expire) {
      result.expireAt = Date.now() + data.expire * 1000
    }
    cache._store[data.key] = result
  },
  del: function(data) {
    for (var i = 0; i < data.keys.length; i++) {
      var key = data.keys[i]
      delete cache._store[key]
    }

    // TODO: Is this necessary?
    return true
  },
  listen: function(worker) {
    return worker.on('message', function(message) {
      if (message.type !== 'cache:request') {
        return
      }
      var data = message.data
      var response = cache[data.method](data)
      worker.send({
        type: 'cache:response',
        data: {
          method: data.method,
          uid: data.uid,
          response: response
        }
      })
    })
  }
}

var workerFactory = {
  MAX_LENGTH: 2,
  _queue: [],
  _spawn: function() {
    var worker = fork("" + __dirname + "/../lib/worker.js", process.argv.slice(2))
    cache.listen(worker)
    return worker
  },
  refresh: function() {
    while (this._queue.length < this.MAX_LENGTH) {
      this._queue.push(this._spawn())
    }
  },
  get: function() {
    if (this._queue.length) {
      return this._queue.shift()
    } else {
      return this._spawn()
    }
  }
}

// Safely shut down the server.
var shutdown = function(code) {
  return server.close(function() {
    return process.exit(code)
  })
}

// Clean up after ourselves before the process exits.
var pidFilePath = impromptu.getServerPidPath()
process.on('exit', function() {
  // Remove the Impromptu server's pid file.
  if (pidFilePath) {
    fs.unlinkSync(pidFilePath)
  }
  // TODO: If the server is using a Unix domain socket, remove the socket file here.
})

// Gracefully shut down on Ctrl+C.
process.on('SIGINT', function() {
  shutdown()
})

// Prepare to create the server.
// -----------------------------

// Write the server's PID to a file.
fs.writeFileSync(pidFilePath, process.pid)

// Build the queue of worker processes.
workerFactory.refresh()

var socketCounter = 0

var npmConfigPath = path.resolve(__dirname + '/../package.json')
var lastPackageReadTime

// Create the server.
var server = net.createServer({
  allowHalfOpen: true
}, function(socket) {
  var startTime = Date.now()
  var socketId = socketCounter++

  dtp.fire('socket-connect', function () {
    return [socketId]
  })

  var socketEnd = function () {
    dtp.fire('socket-end', function () {
      return [socketId]
    })
    socket.end.apply(socket, arguments)
    socket.destroy()
  }

  // Verify that the client is running on the same version as the server.
  // Only check when the server first starts and when the package has changed.
  var needsPackageCheck = ! lastPackageReadTime || fs.statSync(npmConfigPath).mtime > lastPackageReadTime
  if (needsPackageCheck) {
    lastPackageReadTime = new Date()
    var npmConfig = JSON.parse(fs.readFileSync(npmConfigPath))

    // If there's a version mismatch, stop running the server.
    if (impromptu.version() !== npmConfig.version) {
      socketEnd()
      shutdown()
      return
    }
  }

  socket.on('error', (err) => {
    console.error('ERROR', err)
  })

  // Build the body.
  // The body can be:
  // * A newline delimited representation of the shell environment (as formatted
  //   by printenv: each line is equal to "KEY=value").
  // * The string 'shutdown'.
  var body = ''
  var isBodyComplete = false
  socket.on('data', function(data) {
    if (isBodyComplete) return

    body += data

    if (body.indexOf('IMPROMPTU_ENV_COMPLETE=0') != -1 ||
      body == 'shutdown' ||
      body == 'test') {
      isBodyComplete = true
      processBody()
    // Make sure the server isn't being flooded.
    } else if (body.length > 1e6) {
      body = ''
      socketEnd()
    }
  })

  processBody = function () {
    if (body === 'shutdown') {
      socketEnd()
      shutdown()
      return
    }

    var worker = workerFactory.get()
    if (!worker.connected) {
      socketEnd(impromptu.fallback())
      workerFactory.refresh()
      return
    }

    // Bind message listeners that use the socket.
    worker.on('message', function(message) {
      if (message.type === 'write') {
        socket.write(message.data)
        return
      } else if (message.type === 'end') {
        impromptu.log.debug(`Prompt ${socketId} generated in ${Date.now() - startTime}ms`)

        socketEnd(message.data)
        // TODO: Call this when the worker has exited (or disconnect from the
        // worker at this point, and create a different system to handle any orphaned
        // or long-running background refreshes). If refreshing when the worker has
        // exited, make sure not to end up in an infinite loop of errors.
        workerFactory.refresh()
      }
    })

    if (body === 'test') {
      worker.send({
        type: 'test'
      })

      worker.on('message', function(message) {
        if (message.type === 'shutdown') {
          shutdown(message.code || 0)
          socketEnd()
        }
      })

    } else {
      worker.send({
        type: 'env',
        data: body
      })
    }
  }
})

server.listen(pathOrPort)
