# Allow `.coffee` files in `require()`.
require 'coffee-script'

# Expose `Impromptu`.
exports = module.exports = {}

# Expose APIs.
exports.db = require './db'
exports.color = require './color'
exports.Prompt = require './prompt'
exports.Section = require './section'
exports.module = require './module'
