Impromptu = require './impromptu'

prompt =
  # Returns the global connection to the Redis server.
  redis: Impromptu.db.client

  get: (id, field, fn) ->
    @redis().hget(@key(id), field, fn)

  set: (id, field, value, fn) ->
    @redis().hset(@key(id), field, value, fn)

  del: (id, fields..., fn) ->
    @redis().hdel(@key(id), fields..., fn)

  exists: (id, field, fn) ->
    @redis().hexists(@key(id), field, fn)

  key: (id) ->
    "prompt:#{id}"

# Expose `prompt`.
exports = module.exports = prompt;