Impromptu = require '../impromptu'

class Instance extends Impromptu.Cache
  run: (fn) ->
    # Return the cached value if possible.
    if @_cached
      @get fn
    else
      @_setThenGet fn


  get: (fn) ->
    fn null, @_cached ? @options.fallback if fn


  set: (fn) ->
    @_update (err, value) =>
      unless err
        @_cached = value
      fn err, !err if fn


  unset: (fn) ->
    @_cached = null
    fn null, true if fn


# Expose `Instance`.
exports = module.exports = Instance
