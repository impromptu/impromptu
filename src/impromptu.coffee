class Impromptu
  constructor: ->

# Expose `Impromptu`.
exports = module.exports = Impromptu;

# Expose APIs.
exports.DB = require './db'