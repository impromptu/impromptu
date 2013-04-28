# Allow `.coffee` files in `require()`.
require 'coffee-script'
fs = require 'fs'
_ = require 'underscore'

class Impromptu
  @CONFIG_DIR: "#{process.env.HOME}/.impromptu"

  paths: "#{@CONFIG_DIR}/prompt.#{ext}" for ext in ['coffee', 'js']

  constructor: (@options = {}) ->
    @db = new Impromptu.DB @

    cache = new Impromptu.Cache @
    @cache = cache.build
    @cache.key = cache.key

    @module = new Impromptu.ModuleRegistry @
    @prompt = new Impromptu.Prompt @

    configPath = _.find @paths, (path) ->
      fs.existsSync path

    return unless configPath

    # Load a new Impromptu module from a file.
    configFile = require configPath
    return unless typeof configFile == 'function'

    # Go!
    configFile.call @, Impromptu, @prompt.section


# Create custom errors by extending `Impromptu.Error`.
#
# Since the `Error` constructor is a JS native, and can be called without the
# `new` keyword, CoffeeScript's inheritance breaks by default. This is fixed by
# assigning the constructor to the actual `Error` method (which doubles as its
# constructor), thereby allowing normal inheritance to occur. Cool? Cool.
class Impromptu.Error extends Error
  constructor: (@message) ->
    super


# Expose `Impromptu`.
exports = module.exports = Impromptu

# Expose utilities.
exports.color = require './color'
exports.exec = require './exec'

# Expose APIs.
exports.Cache = require './cache'
exports.DB = require './db'
exports.ModuleRegistry = require './module'
exports.Prompt = require './prompt'
