# Allow `.coffee` files in `require()`.
require 'coffee-script'

class Impromptu
  constructor: ->
    @prompt = new Impromptu.Prompt


# Expose `Impromptu`.
exports = module.exports = Impromptu

# Expose APIs.
exports.Prompt = require './prompt'
exports.color = require './color'
exports.db = require './db'
exports.module = require './module'
