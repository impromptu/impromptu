Impromptu = require './impromptu'
path = require 'path'
exec = require('child_process').exec

class _Module
  constructor: (@impromptu, @factory, @name, initialize) ->
    @_methods = {}
    initialize.call @, Impromptu

  register: (key, options) ->
    # Backwards compatibility when @options is set as a function.
    # TODO(koop): Remove compatibility once this API has solidified.
    options = {update: options} if typeof options is 'function'

    # Cache responses using the instance cache by default.
    if typeof options.cache is 'undefined' or options.cache is true
      options.cache = 'instance'

    # If cache is specifically passed a falsy value, use a cache shim.
    # This won't cache the value, it just creates a consistent API.
    options.cache ||= 'shim'

    options.context = @

    Cache = @factory.cache[options.cache] || @factory.cache.instance
    cache = new Cache @impromptu, "#{@name}:#{key}", options

    @_methods[key] = cache.run

  get: (key, fn) ->
    @_methods[key] fn if @_methods[key]

  exec: Impromptu.exec


class ModuleFactory
  constructor: (@impromptu) ->
    # A map between caching keys and cache constructors.
    @cache =
      instance: Impromptu.Cache.Instance
      global: Impromptu.Cache.Global
      shim: Impromptu.Cache.Shim

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
