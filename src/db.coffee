class DB
  constructor: (@impromptu) ->
    @requests = {}

    process.on 'message', (message) =>
      return unless message.type is 'cache:response'

      data = message.data
      return unless @requests[data.method]

      callbacks = @requests[data.method][data.uid]
      callback data.error, data.response for callback in callbacks
      delete @requests[data.method][data.uid]


  send: (method, data, done) ->
    uid = JSON.stringify data

    @requests[method] ?= {}

    # Only send a request if there are no outstanding requests.
    unless @requests[method][uid]
      @requests[method][uid] = []

      data.uid = uid
      data.method = method

      process.send
        type: "cache:request"
        data: data

    @requests[method][uid].push done if done

  exists: (key, done) ->
    @get key, (err, response) ->
      done err, !!response

  get: (key, done) ->
    @send 'get', {key}, done

  set: (key, value, expire, done) ->
    # If we only have three arguments, don't pass an expiry value
    unless done
      done = expire
      expire = 0

    @send 'set', {key, value, expire}, done

  del: (keys..., done) ->
    if typeof done isnt 'function'
      keys.push done
      done = null

    @send 'del', {keys}, done


# Expose `DB`.
exports = module.exports = DB
