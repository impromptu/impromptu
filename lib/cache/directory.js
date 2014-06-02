var GlobalCache = require('./global')
var util = require('util')

/**
 * @constructor
 * @extends {GlobalCache}
 */
function Directory(impromptu, name, options) {
  options = options || {}

  var directory = options.directory || process.env.PWD
  name = name + ':' + directory
  GlobalCache.call(this, impromptu, name, options)
}
util.inherits(Directory, GlobalCache)

module.exports = Directory
