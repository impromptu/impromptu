Impromptu = require './impromptu'

class Cacheable
  constructor: (@impromptu, @name, @options) ->
  run: (fn) => throw Impromptu.AbstractError
  get: (fn) -> throw Impromptu.AbstractError
  set: (fn) -> throw Impromptu.AbstractError
  unset: (fn) -> throw Impromptu.AbstractError

# Expose `Cacheable`.
exports = module.exports = Cacheable
