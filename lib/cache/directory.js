var GlobalCache = require('./global')
var util = require('util')

// Required types.
var State = require('../state')
var DB = require('../db')
var Repository = require('../repository')

/**
 * @constructor
 * @extends {GlobalCache}
 * @param {State} state
 * @param {DB} db
 * @param {Repository} repository
 * @param {string} name The name of the cache key.
 * @param {Object} options The options for this instance of the cache.
 */
function Directory(state, db, repository, name, options) {
  options = options || {}

  var directory = options.directory || process.env.PWD
  name = name + ':' + directory
  GlobalCache.call(this, state, db, repository, name, options)
}
util.inherits(Directory, GlobalCache)

module.exports = Directory
