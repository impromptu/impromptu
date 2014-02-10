var Impromptu = require('./impromptu')
var exec = require('child_process').exec

var registry = {}

function Command(command) {
  this.command = command
  this.callbacks = []
  exec(this.command, function() {
    this.results = arguments

    for (var i = 0; i < this.callbacks.length; i++) {
      var callback = this.callbacks[i]
      callback.apply(Impromptu, arguments)
    }
  }.bind(this))
}

module.exports = function(command, fn) {
  if (!registry[command]) {
    registry[command] = new Command(command)
  }

  var cached = registry[command]
  if (cached.results) {
    fn.apply(Impromptu, cached.results)
  } else {
    cached.callbacks.push(fn)
  }
}
