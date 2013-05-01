# Allow `.coffee` files in `require()`.
path = require 'path'
fs = require 'fs'
_ = require 'underscore'

# Load our own package.json
npmConfig = require '../package.json'

class Impromptu
  @CONFIG_DIR: "#{process.env.HOME}/.impromptu"
  @VERSION: npmConfig.version

  compiledPrompt: "#{@CONFIG_DIR}/.compiled/prompt.js"
  paths: "#{@CONFIG_DIR}/prompt.#{ext}" for ext in ['coffee', 'js']

  _ensureCompiledDirExists: ->
    compiledDir = path.dirname @compiledPrompt
    fs.mkdir compiledDir unless fs.existsSync compiledDir

  _isPromptStale: (sourcePrompt) ->
    # If the compiled prompt doesn't exist, it needs to be generated
    return true unless fs.existsSync @compiledPrompt

    # Otherwise compare last modified times
    fs.statSync(sourcePrompt).mtime > fs.statSync(@compiledPrompt).mtime

  _compilePrompt: (sourcePrompt) ->
    @_ensureCompiledDirExists()

    # If your prompt is already JS, just copy it over
    if /\.js$/.test sourcePrompt
      fs.createReadStream(sourcePrompt).pipe(fs.createWriteStream(@compiledPrompt))

    # If you're using CS, load the CoffeeScript module to compile and cache it
    else if /\.coffee$/.test sourcePrompt
      coffee = require 'coffee-script'
      compiledJs = coffee.compile fs.readFileSync(sourcePrompt).toString()
      fs.writeFileSync @compiledPrompt, compiledJs
    else
      return

  constructor: (@options = {}) ->
    @db = new Impromptu.DB @

    @module = new Impromptu.ModuleFactory @
    @prompt = new Impromptu.Prompt @

    # Make sure we have a source prompt
    return unless sourcePrompt = _.find @paths, (path) ->
      fs.existsSync path

    # Regenerate the prompt if it's been changed or doesn't exist
    @_compilePrompt sourcePrompt if @_isPromptStale sourcePrompt

    # Load a new Impromptu module from a file.
    prompt = require @compiledPrompt
    return unless typeof prompt == 'function'

    # Go!
    prompt.call @, Impromptu, @prompt.section


# Create custom errors by extending `Impromptu.Error`.
#
# Since the `Error` constructor is a JS native, and can be called without the
# `new` keyword, CoffeeScript's inheritance breaks by default. This is fixed by
# assigning the constructor to the actual `Error` method (which doubles as its
# constructor), thereby allowing normal inheritance to occur. Cool? Cool.
class Impromptu.Error extends Error
  constructor: (@message) ->
    super

class Impromptu.AbstractError extends Impromptu.Error
  constructor: (@message) ->
    @message = 'This method should be defined in a subclass.' unless @message


# Expose `Impromptu`.
exports = module.exports = Impromptu

# Expose utilities.
exports.color = require './color'
exports.exec = require './exec'

# Expose APIs.
exports.Cache = require './cache/base'
exports.Cache.Shim = require './cache/shim'
exports.Cache.Instance = require './cache/instance'
exports.Cache.Global = require './cache/global'
exports.DB = require './db'
exports.ModuleFactory = require './module'
exports.Prompt = require './prompt'
