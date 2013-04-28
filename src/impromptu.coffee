# Allow `.coffee` files in `require()`.
coffee = require 'coffee-script'
path = require 'path'
fs = require 'fs'
_ = require 'underscore'

class Impromptu
  @CONFIG_DIR: "#{process.env.HOME}/.impromptu"

  compiledPrompt: "#{@CONFIG_DIR}/.data/prompt.js"
  paths: "#{@CONFIG_DIR}/prompt.#{ext}" for ext in ['coffee', 'js']

  constructor: (@options = {}) ->
    @db = new Impromptu.DB @

    cache = new Impromptu.Cache @
    @cache = cache.build
    @cache.key = cache.key

    @module = new Impromptu.ModuleRegistry @
    @prompt = new Impromptu.Prompt @

    unless fs.existsSync @compiledPrompt
      configPath = _.find @paths, (path) ->
        fs.existsSync path

      return unless configPath

      # Make the directory if needed
      compiledPromptDir = path.dirname @compiledPrompt
      fs.mkdir compiledPromptDir unless fs.existsSync compiledPromptDir

      # If your prompt is already JS, just copy it over
      if /\.js$/.test configPath
        fs.createReadStream(configPath).pipe(fs.createWriteStream(@compiledPrompt))
      else if /\.coffee$/.test configPath
        compiledJs = coffee.compile fs.readFileSync(configPath, {encoding: 'utf-8'})
        fs.writeFileSync @compiledPrompt, compiledJs
      else
        return

    # Load a new Impromptu module from a file.
    configFile = require @compiledPrompt
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
