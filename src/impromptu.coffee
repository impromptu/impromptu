# Allow `.coffee` files in `require()`.
require 'coffee-script'
fs = require 'fs'
_ = require 'underscore'

CONFIG_DIR = "#{process.env.HOME}/.impromptu"

class Impromptu
  paths: "#{CONFIG_DIR}/prompt.#{ext}" for ext in ['coffee', 'js']

  constructor: ->
    @prompt = new Impromptu.Prompt

    configPath = _.find @paths, (path) ->
      fs.existsSync path

    return unless configPath

    # Load a new Impromptu module from a file.
    configFile = require configPath
    return unless typeof configFile == 'function'

    # Go!
    configFile Impromptu, @prompt.section


# Expose `Impromptu`.
exports = module.exports = Impromptu

# Expose APIs.
exports.CONFIG_DIR = CONFIG_DIR
exports.Prompt = require './prompt'
exports.color = require './color'
exports.db = require './db'
exports.module = require './module'
