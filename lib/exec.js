var child_process = require('child_process')

/**
 * The executable cache.
 * @type {Object.<!Executable>}
 */
var registry = {}

/**
 * A memoized executable command. The first time the command is run, the results are stored.
 * Callbacks are tracked while the command is running to avoid race conditions.
 *
 * @constructor
 * @param {string} command The command to execute.
 */
function Executable(command) {
  /** @type {string} */
  this.command = command

  /** @type {Array.<function(Error, Buffer, Buffer)>} */
  this.callbacks = []

  child_process.exec(this.command, function() {
    this.results = arguments

    for (var i = 0; i < this.callbacks.length; i++) {
      var callback = this.callbacks[i]
      callback.apply(null, arguments)
    }
  }.bind(this))
}

/**
 * Executes a memoized command and triggers the callback on a result.
 * @param {string} command
 * @param {function(Error, Buffer, Buffer)} callback
 */
module.exports = function(command, callback) {
  if (!registry[command]) {
    registry[command] = new Executable(command)
  }

  var executable = registry[command]
  if (executable.results) {
    callback.apply(null, executable.results)
  } else {
    executable.callbacks.push(callback)
  }
}
