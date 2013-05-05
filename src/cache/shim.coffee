Impromptu = require '../impromptu'

# A shim that runs a function in the context of Impromptu's caching interface.
# Does NOT cache the result!
class Shim extends Impromptu.Cache
  run: (fn) ->
    @get fn


  get: (fn) ->
    @_update fn


  set: (fn) ->
    @get (err, value) ->
      fn err, !err if fn


  unset: (fn) ->
    fn null, true if fn


# Expose `Shim`.
exports = module.exports = Shim
