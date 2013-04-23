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
    initialize.call @, Impromptu

  register: (key, options, fn) ->
    method = new _Method @, key, options, fn
    @_registry[key] = method.run

  get: (key, fn) ->
    @_registry[key] fn if @_registry[key]

  exec: (command, fn) ->
    return fn.apply @, @_commandCache[command] if @_commandCache[command]

    exec command, =>
      @_commandCache[command] = arguments
      fn.apply @, arguments


# Expose `module`.
exports = module.exports = {}

# Register a new Impromptu module.
exports.register = (fn) ->
  new _Module(fn)._registry

# Load a new Impromptu module from a file.
exports.load = (filepath) ->
  fn = require path.resolve(filepath)
  exports.register fn if typeof fn == 'function'
