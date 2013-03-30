Impromptu = require './impromptu'

class Prompt
  constructor: (id) ->
    @key = "prompt:#{id}"

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

# Expose `prompt`.
exports = module.exports = Prompt