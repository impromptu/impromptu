Impromptu = require '../impromptu'

# A shim that runs a function in the context of Impromptu's caching interface.
# Does NOT cache the result!
class Shim extends Impromptu.Cache
  run: (fn) ->
    @get fn


  get: (fn) ->
    @options.update.call @options.context, fn


  set: (fn) ->
    @get (err, value) ->
      fn err, !err


  unset: (fn) ->
    fn null, true


# Expose `Shim`.
exports = module.exports = Shim
