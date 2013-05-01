Impromptu = require '../impromptu'

# An abstract class that manages how a method is cached.
class Cache
  constructor: (@impromptu, @name, @options) ->
    # Build our own `run` instance-method to accurately reflect the fact that
    # `run` is always asynchronous and requires an argument to declare itself
    # as such to our API. This feels a bit hacky, but using CoffeeScript's `=>`
    # in `Cache.prototype` creates a zero argument function when compiled.
    protoRun = @run
    @run = (done) =>
      protoRun.apply @, arguments


  # The main method.
  #
  # Accepts a `fn` with a signature of `err, results`, where `results` is the
  # cached value. Optionally updates the cache.
  #
  # This method is bound to the instance so the method can be passed around
  # without the instance.
  run: (fn) -> throw Impromptu.AbstractError


  # Gets the cached value.
  #
  # Accepts a `fn` with a signature of `err, results`, where `results` is the
  # cached value. Does not update the cache.
  get: (fn) -> throw Impromptu.AbstractError


  # Updates the cached value.
  #
  # Accepts a `fn` with a signature of `err, success`, where `success` is a
  # boolean indicating whether the cached value was updated.
  set: (fn) -> throw Impromptu.AbstractError


  # Clears the cached value.
  #
  # Accepts a `fn` with a signature of `err, success`, where `success` is a
  # boolean indicating whether the value was removed from the cache.
  unset: (fn) -> throw Impromptu.AbstractError


# Expose `Cache`.
exports = module.exports = Cache
