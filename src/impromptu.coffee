# Allow `.coffee` files in `require()`.
path = require 'path'
fs = require 'fs'
_ = require 'underscore'

# Load our own package.json
npmConfig = require '../package.json'

class Impromptu
  @VERSION: npmConfig.version
  @CONFIG_DIR: "#{process.env.HOME}/.impromptu"

  compiledPromptPath: "#{@CONFIG_DIR}/.compiled/prompt.js"
  paths: "#{@CONFIG_DIR}/prompt.#{ext}" for ext in ['coffee', 'js']

  constructor: (@options = {}) ->
    @color = new Impromptu.Color @
    @repository = new Impromptu.RepositoryFactory @
    @db = new Impromptu.DB @

    @module = new Impromptu.ModuleFactory @
    @prompt = new Impromptu.Prompt @

    # Ensure the prompt is compiled.
    @_compilePrompt()

  load: ->
    # Ensure the prompt is compiled.
    # Double-check that nothing has changed since Impromptu was instantiated.
    return @ unless @_compilePrompt()

    # Load the prompt file.
    prompt = require @compiledPromptPath
    try
      prompt.call? @, Impromptu, @prompt.section
    catch err
      @_error 'javascript', 'Your prompt file triggered a JavaScript error.', err

    return @

  # Returns true if the compiled prompt file exists.
  _compilePrompt: ->
    # Make sure we have a source prompt.
    # If we don't find a prompt file, bail.
    return unless sourcePrompt = _.find @paths, (path) ->
      fs.existsSync path

    # Check whether the compiled prompt exists and is up to date.
    if fs.existsSync @compiledPromptPath
      sourceMtime   = fs.statSync(sourcePrompt).mtime
      compiledMtime = fs.statSync(@compiledPromptPath).mtime

      return true if sourceMtime < compiledMtime

    # Ensure the compiled prompt directory exists.
    compiledDir = path.dirname @compiledPromptPath
    fs.mkdir compiledDir unless fs.existsSync compiledDir

    # If your prompt is already JS, just copy it over.
    if /\.js$/.test sourcePrompt
      fs.createReadStream(sourcePrompt).pipe(fs.createWriteStream(@compiledPromptPath))
      return true

    # If you're using CS, load the CoffeeScript module to compile and cache it.
    else if /\.coffee$/.test sourcePrompt
      # Clear any pre-existing CoffeeScript compiler errors;
      # we only care about whether the most recent compilation succeeded.
      @_clearError 'coffeescript'

      coffee = require 'coffee-script'
      try
        compiledJs = coffee.compile fs.readFileSync(sourcePrompt).toString()
        fs.writeFileSync @compiledPromptPath, compiledJs
        return true
      catch err
        @_error 'coffeescript', 'Your prompt file is not valid CoffeeScript.', err
        return

  _error: (name, content, err) ->
    logPath = "#{Impromptu.CONFIG_DIR}/impromptu-debug.log"

    @prompt.section "error:message:#{name}",
      content: content
      background: 'red'
      foreground: 'white'

    @prompt.section "error:instructions:#{name}",
      content: "\nDetails can be found in #{logPath}\n"
      options:
        newlines: true

    fs.appendFileSync logPath,
      """
      ----------------------------------------
      #{new Date()}
      ----------------------------------------
      #{content}

      #{err.stack}



      """

  _clearError: (name) ->
    @prompt.section "error:message:#{name}",
      content: ''

    @prompt.section "error:instructions:#{name}",
      content: ''


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
exports.cli = require './cli'
exports.exec = require './exec'

# Expose APIs.
exports.Color = require './color'
exports.Cache = require './cache/base'
exports.Cache.Shim = require './cache/shim'
exports.Cache.Instance = require './cache/instance'
exports.Cache.Global = require './cache/global'
exports.Cache.Directory = require './cache/directory'
exports.Cache.Repository = require './cache/repository'
exports.DB = require './db'
exports.ModuleFactory = require './module'
exports.Prompt = require './prompt'
exports.RepositoryFactory = require './repository'
