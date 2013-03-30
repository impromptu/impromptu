Impromptu = require './impromptu'
async = require 'async'
_ = require 'underscore'

class Prompt
  constructor: (@_id) ->
    @key = "prompt:#{@_id}"

  # Returns the global connection to the Redis server.
  redis: Impromptu.db.client

  get: (field, fn) ->
    @redis().hget(@key, field, fn)

  set: (field, value, fn) ->
    @redis().hset(@key, field, value, fn)

  del: (fields..., fn) ->
    @redis().hdel(@key, fields..., fn)

  exists: (field, fn) ->
    @redis().hexists(@key, field, fn)

  # Get the order of prompt sections.
  order: (fn) ->
    # Sort the list from high to low scores.
    @redis().zrevrange "#{@key}:sections", 0, -1, fn

  # Build the prompt.
  build: (fn) ->
    @section ?= new Impromptu.Section this

    async.waterfall [
      (done) =>
        @order done

      (order, done) =>
        # Fetch each section's display properties.
        async.map order, @section.get.bind(@section), done

      (sections, done) =>
        result = sections.reduce (value, section) ->
          "#{value || ''} #{section.content}"
        , ''
        done null, result.trim()
    ], fn

# Expose `prompt`.
exports = module.exports = Prompt