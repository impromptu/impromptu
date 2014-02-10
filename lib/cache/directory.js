var Impromptu = require('../impromptu')
var util = require('util')

function Directory(impromptu, name, options) {
  options = options || {}

  var directory = options.directory || process.env.PWD
  name = name + ':' + directory
  Impromptu.Cache.Global.call(this, impromptu, name, options)
}
util.inherits(Directory, Impromptu.Cache.Global)

module.exports = Directory
