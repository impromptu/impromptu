Impromptu = require './impromptu'
path = require 'path'
exec = require('child_process').exec

class _Method
  constructor: (@module, @name, @options) ->
    # Backwards compatibility when @options is set as a function.
    # TODO(koop): Remove compatibility once this API has solidified.
    @options = {update: @options} if typeof @options is 'function'

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
    if @options.update.length
      callback = (err, results) =>
        @cache err, results, done

    try
      results = @options.update.call @module, callback
    catch err
    finally
      # Process the results if method is synchronous.
      @cache err, results, done unless callback

  cache: (err, results, done) =>
    if @options.cache and not err
      @results = results
    done err, results


class _Module
  constructor: (@impromptu, @moduleRegistry, initialize) ->
    @_methods = {}
    initialize.call @, Impromptu

  name: (key) ->
    return @_name unless key

    @moduleRegistry.unset @_name
    @_name = key
    @moduleRegistry.set @_name, @_methods

  register: (key, options) ->
    method = new _Method @, key, options
    @_methods[key] = method.run

  get: (key, fn) ->
    @_methods[key] fn if @_methods[key]

  exec: Impromptu.exec


class ModuleRegistry
  constructor: (@impromptu) ->
    @_modules = {}

  # Register a new Impromptu module.
  register: (fn) ->
    new _Module(@impromptu, @, fn)._methods

  # Require and register a new Impromptu module.
  require: (module) ->
    fn = require "#{Impromptu.CONFIG_DIR}/node_modules/#{module}"
    @register fn if typeof fn == 'function'

  # Get an existing Impromptu module.
  get: (name) ->
    @_modules[name]

  # Set an existing Impromptu module.
  set: (name, methods) ->
    @_modules[name] = methods

  # Unset an existing Impromptu module.
  unset: (name) ->
    delete @_modules[name]


# Expose `ModuleRegistry`.
exports = module.exports = ModuleRegistry