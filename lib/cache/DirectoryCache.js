var GlobalCache = require('./GlobalCache')
var util = require('util')

// Required for type checking.
var DB = require('../DB')
var State = require('../State')


/**
 * @constructor
 * @extends {GlobalCache}
 * @param {State} state
 * @param {DB} db
 * @param {string} name The name of the cache key.
 * @param {Object} options The options for this instance of the cache.
 */
function DirectoryCache(state, db, name, options) {
  options = options || {}

  var directory = options.directory || process.env.PWD
  name = name + ':' + directory
  GlobalCache.call(this, state, db, name, options)
}
util.inherits(DirectoryCache, GlobalCache)

module.exports = DirectoryCache
