var Impromptu = require('../impromptu')
var util = require('util')
var async = require('async')

function Repository() {
  Impromptu.Cache.Global.apply(this, arguments)
}
util.inherits(Repository, Impromptu.Cache.Global)

Repository.prototype.prepare = function(method, fn) {
  if (this._prepared) {
    Impromptu.Cache.Global.prototype[method].call(this, fn)
    return
  }

  var parts = ['root', 'branch']
  if (this.options.commit) {
    parts.push('commit')
  }

  // Fetch all the parts for the repository to generate the repository's key name.
  async.map(parts, function(part, done) {
    return this.impromptu.repository[part](done)
  }.bind(this), function(err, results) {
    if (err) {
      return fn(err)
    }

    // Remove any trailing empty parts.
    while (results.length && !results[results.length - 1]) {
      results.pop()
    }

    // Update the name.
    results.unshift(this.name)
    this.name = results.join(':')

    this._prepared = true
    Impromptu.Cache.Global.prototype[method].call(this, fn)
  }.bind(this))
}

;['run', 'get', 'set', 'unset'].forEach(function(method) {
  Repository.prototype[method] = function(fn) {
    this.prepare(method, fn)
  }
})

module.exports = Repository
