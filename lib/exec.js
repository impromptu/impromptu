'use strict'

var child_process = require('child_process')

// Required for type checking.
var Log = require('./Log')

/**
 * The executable cache.
 * @type {Object.<!Executable>}
 */
var registry = Object.create(null)


/**
 * A memoized executable command. The first time the command is run, the results are stored.
 * Callbacks are tracked while the command is running to avoid race conditions.
 *
 * @constructor
 * @param {Log} log A logging instance.
 * @param {string} command The command to execute.
 */
function Executable(log, command) {
  /** @type {string} */
  this.command = command

  /** @type {Array.<function(Error, Buffer, Buffer)>} */
  this.callbacks = []

  /** @type {Arguments} */
  this.results = null

  var startTime = Date.now()
  child_process.exec(this.command, function() {
    var timeDiff = `${Date.now() - startTime}`
    if (timeDiff.length < 3) timeDiff = `   ${timeDiff}`.slice(-3)
    log.debug(`Exec | ${timeDiff}ms | ${this.command}`)
    this.results = arguments

    for (var i = 0; i < this.callbacks.length; i++) {
      var callback = this.callbacks[i]
      callback.apply(null, arguments)
    }
  }.bind(this))
}

/**
 * @param {function(Error, Buffer, Buffer)} callback
 */
Executable.prototype.addCallback = function (callback) {
  if (this.results) {
    callback.apply(null, this.results)
  } else {
    this.callbacks.push(callback)
  }
}


/**
 * Executes a memoized command and triggers the callback on a result.
 * @param {Log} log
 * @param {string} command
 * @param {function(Error, Buffer, Buffer)=} opt_callback
 */
function execute(log, command, opt_callback) {
  if (!registry[command]) {
    registry[command] = new Executable(log, command)
  }

  var executable = registry[command]
  if (opt_callback) executable.addCallback(opt_callback)
}




module.exports = function (log) {
  return execute.bind(null, log)
}
