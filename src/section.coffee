Impromptu = require './impromptu'
async = require 'async'

section =
  # Returns the global connection to the Redis server.
  redis: Impromptu.db.client

  content: (id, key, value, fn) ->
    section.property(id, 'content', key, value, fn)

  foreground: (id, key, value, fn) ->
    section.property(id, 'foreground', key, value, fn)

  background: (id, key, value, fn) ->
    section.property(id, 'background', key, value, fn)

  priority: (id, member, score) ->
    key = "#{Impromptu.prompt.key(id)}:sections"

    if score?
      redis.zadd key, score, member
    else
      redis.zscore key, member

  del: (id, key, fn) ->
    properties = ['content', 'foreground', 'background'].map (property) ->
      "section:#{key}:#{property}"

    async.parallel [
      (done) -> Impromptu.prompt.del id, properties..., done
      (done) -> @redis().zrem "#{Impromptu.prompt.key(id)}:sections", key, done
    ], fn

  # A getter/setter for section properties.
  property: (id, property, key, value, fn) ->
    key = "section:#{key}:#{property}"

    if not fn and typeof value is 'function'
      fn = value
      value = null

    if value
      Impromptu.prompt.set(id, key, value, fn)
    else
      Impromptu.prompt.get(id, key, fn)

# Expose `prompt`.
exports = module.exports = section