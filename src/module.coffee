Impromptu = require './impromptu'
path = require 'path'
exec = require('child_process').exec

class _Method
  constructor: (@module, @name, @options, @fn) ->
    # `@options` are optional.
    if typeof @options is 'function'
      @fn = @options
      @options = {}

    # Cache responses by default.
    @options.cache = true if typeof @options.cache is 'undefined'

    # Build our own `run` instance-method to accurately reflect the fact that
    # `run` is always asynchronous and requires an argument to declare itself
    # as such to our API. This feels a bit hacky, but using CoffeeScript's `=>`
    # in `_Method.prototype` creates a zero argument function when compiled.
    @run = (done) =>
      _Method::run.apply @, arguments

  run: (done) ->
    return done null, @results if @results

    # If the method accepts an argument, it is asynchronous.
    if @fn.length
      callback = (err, results) =>
        @cache err, results, done

    try
      results = @fn.call @module, callback
    catch err
    finally
      # Process the results if method is synchronous.
      @cache err, results, done unless callback

  cache: (err, results, done) =>
    if @options.cache and not err
      @results = results
    done err, results


class _Module
  constructor: (initialize) ->
    @_registry = {}
    @_commandCache = {}
    @_commandCallbacks = {}
    initialize.call @, Impromptu

  register: (key, options, fn) ->
    method = new _Method @, key, options, fn
    @_registry[key] = method.run

  get: (key, fn) ->
    @_registry[key] fn if @_registry[key]

  exec: (command, fn) ->
    # If we've already run the command, use the cached values.
    if @_commandCache[command]
      fn.apply @, @_commandCache[command]
      return

    # We only run a command once. If a callbacks object exists, the command is
    # currently in the process of running.
    if @_commandCallbacks[command]
      @_commandCallbacks[command].push fn
      return

    # Run the command.
    @_commandCallbacks[command] = [fn]
    exec command, =>
      @_commandCache[command] = arguments
      callback.apply @, arguments for callback in @_commandCallbacks[command]
      delete @_commandCallbacks[command]


# Expose `module`.
exports = module.exports = {}

# Register a new Impromptu module.
exports.register = (fn) ->
  new _Module(fn)._registry

# Load a new Impromptu module from a file.
exports.load = (filepath) ->
  fn = require path.resolve(filepath)
  exports.register fn if typeof fn == 'function'
