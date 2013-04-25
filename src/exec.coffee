Impromptu = require './impromptu'
exec = require('child_process').exec

_registry = {}

class _Command
  constructor: (@command) ->
    @callbacks = []

    exec @command, =>
      @results = arguments
      fn.apply Impromptu, arguments for fn in @callbacks


# Expose `module`.
exports = module.exports = (command, fn) ->
  cached = _registry[command]

  unless cached
    cached = _registry[command] = new _Command command

  if cached.results
    fn.apply Impromptu, cached.results
  else
    cached.callbacks.push fn

  # The callback should not have an effect on the return value.
  return null
