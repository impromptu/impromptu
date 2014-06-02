var GlobalCache = require('./global')
var util = require('util')

/**
 * @constructor
 * @extends {GlobalCache}
 * @param {*} impromptu
 * @param {string} name The name of the cache key.
 * @param {Object} options The options for this instance of the cache.
 */
function Directory(impromptu, name, options) {
  options = options || {}

  var directory = options.directory || process.env.PWD
  name = name + ':' + directory
  GlobalCache.call(this, impromptu, name, options)
}
util.inherits(Directory, GlobalCache)

module.exports = Directory
