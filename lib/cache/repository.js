var GlobalCache = require('./global')
var util = require('util')
var async = require('async')

/**
 * @constructor
 * @extends {GlobalCache}
 */
function Repository() {
  GlobalCache.apply(this, arguments)
}
util.inherits(Repository, GlobalCache)

Repository.prototype.prepare = function(method, fn) {
  if (this._prepared) {
    GlobalCache.prototype[method].call(this, fn)
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
    GlobalCache.prototype[method].call(this, fn)
  }.bind(this))
}

; // Run each exposed method through lazy async calculation of the key name.
['run', 'get', 'set', 'unset'].forEach(function(method) {
  Repository.prototype[method] = function(fn) {
    this.prepare(method, fn)
  }
})

module.exports = Repository
