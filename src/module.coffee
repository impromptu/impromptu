Impromptu = require './impromptu'
path = require 'path'
exec = require('child_process').exec

_moduleRegistry = {}

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
    initialize.call @, Impromptu

  name: (key) ->
    return @_name unless key

    if @_name
      delete _moduleRegistry[@_name]
    _moduleRegistry[key] = @_registry
    @_name = key

  register: (key, options, fn) ->
    method = new _Method @, key, options, fn
    @_registry[key] = method.run

  get: (key, fn) ->
    @_registry[key] fn if @_registry[key]

  exec: Impromptu.exec


# Expose `module`.
exports = module.exports = {}

# Get an existing Impromptu module.
exports.get = (name) ->
  _moduleRegistry[name]

# Register a new Impromptu module.
exports.register = (fn) ->
  new _Module(fn)._registry

# Require and register a new Impromptu module.
exports.require = (module) ->
  fn = require "#{Impromptu.CONFIG_DIR}/node_modules/#{module}"
  exports.register fn if typeof fn == 'function'
