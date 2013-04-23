# Allow `.coffee` files in `require()`.
require 'coffee-script'
fs = require 'fs'
_ = require 'underscore'

HOME = process.env.HOME

class Impromptu
  paths: ["#{HOME}/.tu.coffee", "#{HOME}/.tu.js", "#{HOME}/.tu"]

  constructor: ->
    @prompt = new Impromptu.Prompt

    tuPath = _.find @paths, (path) ->
      fs.existsSync path

    return unless tuPath

    # Load a new Impromptu module from a file.
    tuFile = require tuPath
    return unless typeof tuFile == 'function'

    # Go!
    tuFile Impromptu, @prompt.section


# Expose `Impromptu`.
exports = module.exports = Impromptu

# Expose APIs.
exports.Prompt = require './prompt'
exports.color = require './color'
exports.db = require './db'
exports.module = require './module'
