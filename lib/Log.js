var fs = require('fs')

// Required for type checking.
var State = require('./State')

/**
 * @constructor
 * @param {State} state
 */
function Log(state) {
  /** @private {State} */
  this._state = state

  /** @private {Log.Level} */
  this._verbosity = Log.Level.NOTICE

  /**
   * The default destinations of the logs.
   * @type {Log.Destinations}
   */
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
 *
 * @enum {number}
 */
Log.Level = {
  WARNING: 1,
  NOTICE: 2,
  DEBUG: 3
}

/**
 * The delimiter for each log level.
 * @enum {string}
 */
Log.Delimiter = {
  1: '#',
  2: '*',
  3: '-'
}

/**
 * Indicates where to send a given message.
 *
 * @typedef {{
 *   file: (boolean|undefined),
 *   server: (boolean|undefined),
 *   stdout: (boolean|undefined)
 * }}
 */
Log.Destinations; // jshint ignore:line

/**
 * Options that can be passed to the low-level `write` method.
 *
 * options.level - Specifies the log level of the message.
 *   Messages without a specified level will always be written.
 *
 * options.format - Whether the message should be formatted.
 *
 * options.destinations - Whether the message should be written to various destiations.
 *   Defaults to `this.defaultDestinations`.
 *
 * @typedef {{
 *   level: Log.Level,
 *   format: boolean,
 *   destinations: Log.Destinations
 * }}
 */
Log.Options; // jshint ignore:line

/**
 * @return {Log.Level} The verbosity of the logger.
 */
Log.prototype.getVerbosity = function() {
  return this._verbosity
}

/**
 * @param {Log.Level|string|number} level The verbosity of the logger.
 */
Log.prototype.setVerbosity = function(level) {
  if (level === 'warning' || level === Log.Level.WARNING) {
    this._verbosity = Log.Level.WARNING
  }
  if (level === 'notice' || level === Log.Level.NOTICE) {
    this._verbosity = Log.Level.NOTICE
  }
  if (level === 'debug' || level === Log.Level.DEBUG) {
    this._verbosity = Log.Level.DEBUG
  }
}

/**
 * Prints a message to stdout. Useful for debugging.
 * @param {string} message
 */
Log.prototype.output = function(message) {
  this.write(message, {
    level: Log.Level.WARNING,
    format: false,
    destinations: {
      file: false,
      server: false,
      stdout: true
    }
  })
}

/**
 * Logs a warning message with a corresponding error stack.
 * @param {string} message
 * @param {Error} error
 */
Log.prototype.error = function(message, error) {
  this.warning(message + "\n\n" +
    error.stack + "\n----------------------------------------")
}

/**
 * Logs a warning message.
 * @param {string} message
 */
Log.prototype.warning = function(message) {
  this.write(message, {
    level: Log.Level.WARNING,
    format: true,
    destinations: this.defaultDestinations
  })
}

/**
 * Logs a notice.
 * @param {string} message
 */
Log.prototype.notice = function(message) {
  this.write(message, {
    level: Log.Level.NOTICE,
    format: true,
    destinations: this.defaultDestinations
  })
}

/**
 * Logs a debug message.
 * @param {string} message
 */
Log.prototype.debug = function(message) {
  this.write(message, {
    level: Log.Level.DEBUG,
    format: true,
    destinations: this.defaultDestinations
  })
}

/**
 * Low-level method to write output and logs.
 * Accepts a message and an options object.
 *
 * @param {string} message
 * @param {Log.Options} options
 */
Log.prototype.write = function(message, options) {
  var destinations

  if (options.level && options.level > this._state.get('verbosity')) {
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

/**
 * Formats a log message with the process PID and date, with a delimiter that indicates the log level.
 * @param {string} message
 * @param {Log.Level} level
 */
Log.prototype.format = function(message, level) {
  var delimiter

  delimiter = Log.Delimiter[level] ? "" + Log.Delimiter[level] + " " : ''
  return "[" + process.pid + "] " + (new Date().toISOString()) + " " + delimiter + message
}

/**
 * Writes a message to a file.
 * @param {string} message
 * @private
 */
Log.prototype._writeToFileRaw = function(message) {
  fs.appendFileSync(this._state.get('path.log'), message)
}

/**
 * Writes a message to a stdout.
 * @param {string} message
 * @private
 */
Log.prototype._writeToStdoutRaw = function(message) {
  if (process.send && process.connected) {
    process.send({
      type: 'write',
      data: message + '\n'
    })
  } else {
    console.log(message)
  }
}

/**
 * Writes a message to the server.
 * @param {string} message
 * @private
 */
Log.prototype._writeToServerRaw = function(message) {
  console.log(message)
}

module.exports = Log
