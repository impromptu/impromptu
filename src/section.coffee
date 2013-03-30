Impromptu = require './impromptu'
async = require 'async'
_ = require 'underscore'

class Section
  # A section can be created with an existing prompt object,
  # or create its own with an ID string.
  constructor: (@prompt) ->
    if typeof @prompt is 'string'
      @prompt = new Impromptu.Prompt @prompt

  # Returns the global connection to the Redis server.
  redis: Impromptu.db.client

  get: (key, fn) ->
    properties = ['content', 'foreground', 'background']
    async.map properties, (property, done) =>
      @[property] key, done
    , (err, results) ->
      results = _.object properties, results
      fn err, results

  set: (key, properties, fn) ->
    async.each ['content', 'foreground', 'background'], (property, done) =>
      @[property] key, properties[property], done if properties[property]?
    , fn

  content: (key, value, fn) ->
    @property 'content', key, value, fn

  foreground: (key, value, fn) ->
    @property 'foreground', key, value, fn

  background: (key, value, fn) ->
    @property 'background', key, value, fn

  priority: (member, score, fn) ->
    key = "#{@prompt.key}:sections"

    if score?
      @redis().zadd key, score, member, fn
    else
      @redis().zscore key, member, fn

  del: (key, fn) ->
    properties = ['content', 'foreground', 'background'].map (property) ->
      "section:#{key}:#{property}"

    async.parallel [
      (done) => @prompt.del properties..., done
      (done) => @redis().zrem "#{@prompt.key}:sections", key, done
    ], fn

  # A getter/setter for section properties.
  property: (property, key, value, fn) ->
    key = "section:#{key}:#{property}"

    # Allow the getter to still receive a callback.
    if not fn and typeof value is 'function'
      fn = value
      value = null

    if value
      @prompt.set key, value, fn
    else
      @prompt.get key, fn

# Expose `prompt`.
exports = module.exports = Section