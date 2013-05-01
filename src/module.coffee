Impromptu = require './impromptu'
path = require 'path'
exec = require('child_process').exec

class _Method
  constructor: (@impromptu, @module, @name, @options) ->
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
  constructor: (@impromptu, @factory, @name, initialize) ->
    @_methods = {}
    initialize.call @, Impromptu

  register: (key, options) ->
    method = new _Method @impromptu, @, key, options
    @_methods[key] = method.run

  get: (key, fn) ->
    @_methods[key] fn if @_methods[key]

  exec: Impromptu.exec


class ModuleFactory
  constructor: (@impromptu) ->

  # Register a new Impromptu module.
  register: (name, fn) ->
    new _Module(@impromptu, @, name, fn)._methods

  # Require and register a new Impromptu module.
  require: (module) ->
    path = "#{Impromptu.CONFIG_DIR}/node_modules/#{module}"
    fn = require path
    @register path, fn if typeof fn == 'function'


# Expose `ModuleFactory`.
exports = module.exports = ModuleFactory
