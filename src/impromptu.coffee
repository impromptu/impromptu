class Impromptu
  constructor: ->

# Expose `Impromptu`.
exports = module.exports = Impromptu;

# Expose APIs.
exports.db = require './db'