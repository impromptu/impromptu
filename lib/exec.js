var exec = require('child_process').exec

var registry = {}

/**
 * @constructor
 */
function Command(command) {
  this.command = command
  this.callbacks = []
  exec(this.command, function() {
    this.results = arguments

    for (var i = 0; i < this.callbacks.length; i++) {
      var callback = this.callbacks[i]
      callback.apply(null, arguments)
    }
  }.bind(this))
}

module.exports = function(command, fn) {
  if (!registry[command]) {
    registry[command] = new Command(command)
  }

  var cached = registry[command]
  if (cached.results) {
    fn.apply(null, cached.results)
  } else {
    cached.callbacks.push(fn)
  }
}
