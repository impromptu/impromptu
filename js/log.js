var Impromptu = require('./impromptu')
var fs = require('fs')

function Log(impromptu, verbosity) {
  this.impromptu = impromptu
  this._verbosity = Log.Levels.NOTICE
  this.setVerbosity(verbosity)
  this.defaultDestinations = {
    file: true,
    server: false,
    stdout: false
  }
}

/**
 * The log verbosity level.
 *
 * Do not refer to these numbers directly, use their corresponding key-names instead.
 * Inspired by the Redis log levels.
 *
 * Log levels:
 *   warning (only very important / critical messages are logged)
 *   notice (moderately verbose, what you want in production probably)
 *   debug (a lot of information, useful for development/testing)
 */
Log.Levels = {
  WARNING: 1,
  NOTICE: 2,
  DEBUG: 3
}

Log.Delimiters = {
  1: '#',
  2: '*',
  3: '-'
}

Log.prototype.setVerbosity = function(level) {
  if (level === 'warning') {
    this._verbosity = Log.Levels.WARNING
  }
  if (level === 'notice') {
    this._verbosity = Log.Levels.NOTICE
  }
  if (level === 'debug') {
    this._verbosity = Log.Levels.DEBUG
  }
}

Log.prototype.output = function(message) {
  this.write(message, {
    level: null,
    format: false,
    destinations: {
      file: false,
      server: false,
      stdout: true
    }
  })
}

Log.prototype.warning = function(message) {
  this.write(message, {
    level: Log.Levels.WARNING,
    format: true,
    destinations: this.defaultDestinations
  })
}

Log.prototype.notice = function(message) {
  this.write(message, {
    level: Log.Levels.NOTICE,
    format: true,
    destinations: this.defaultDestinations
  })
}

Log.prototype.debug = function(message) {
  this.write(message, {
    level: Log.Levels.DEBUG,
    format: true,
    destinations: this.defaultDestinations
  })
}


/**
 * Low-level method to write output and logs.
 * Accepts a message and an options object.
 *
 * options.level - Integer. Specifies the log level of the message.
 *                 Optional. Messages without a specified level will always be written.
 *
 * options.format - Boolean. Whether the message should be formatted.
 *
 * options.destinations - Whether the message should be written to various destiations.
 *                        An object with three boolean keys: 'file', 'server', and 'stdout'.
 *                        Optional, defaults to `this.defaultDestinations`.
 */
Log.prototype.write = function(message, options) {
  var destinations

  if (options.level && options.level > this._verbosity) {
    return
  }
  destinations = options.destinations || this.defaultDestinations
  if (options.format) {
    message = this.format(message, options.level)
  }
  if (destinations.stdout) {
    this._writeToStdoutRaw(message)
  }
  if (destinations.server) {
    this._writeToServerRaw(message)
  }
  if (destinations.file) {
    this._writeToFileRaw(message)
  }
}

Log.prototype.format = function(message, level) {
  var delimiter

  delimiter = Log.Delimiters[level] ? "" + Log.Delimiters[level] + " " : ''
  return "[" + process.pid + "] " + (new Date().toISOString()) + " " + delimiter + message
}

Log.prototype._writeToFileRaw = function(message) {
  fs.appendFileSync(this.impromptu.path.log, message)
}

Log.prototype._writeToStdoutRaw = function(message) {
  if (process.send) {
    process.send({
      type: 'write',
      data: "" + message + "\n"
    })
  } else {
    console.log(message)
  }
}

Log.prototype._writeToServerRaw = function(message) {
  console.log(message)
}

module.exports = Log
