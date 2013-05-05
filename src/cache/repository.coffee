Impromptu = require '../impromptu'
async = require 'async'

class Repository extends Impromptu.Cache.Global
  prepare: (method, fn) ->
    return Impromptu.Cache.Global::[method].call @, fn if @_prepared

    parts = ['root', 'branch']
    parts.push 'commit' if @options.commit

    async.map parts, (part, done) =>
      @impromptu.repository[part] done
    , (err, results) =>
      return fn err if err

      # Remove any trailing empty parts.
      while results.length and not results[results.length - 1]
        results.pop()

      # Update the name.
      results.unshift @name
      @name = results.join ':'

      @_prepared = true
      Impromptu.Cache.Global::[method].call @, fn


['run', 'get', 'set', 'unset'].forEach (method) ->
  Repository::[method] = (fn) ->
    @prepare method, fn


# Expose `Repository`.
exports = module.exports = Repository
