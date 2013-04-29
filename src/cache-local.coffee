Impromptu = require './impromptu'

class Local extends Impromptu.Cache
  run: (fn) =>
    return get fn if @_cached

    @set (err, results) =>
      if err then fn err else @get fn


  get: (fn) ->
    return fn null, @_cached


  set: (fn) ->
    @options.update.call @options.context, (err, value) =>
      unless err
        @_cached = value
      fn err, !err


  unset: (fn) ->
    @_cached = null
    fn null, true


# Expose `Local`.
exports = module.exports = Local
