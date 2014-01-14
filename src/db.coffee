class DB
  constructor: (@impromptu) ->
    @requests = {}

    process.on 'message', (message) ->
      return unless message.type is 'cache:response'

      data = message.data
      return unless @requests[data.method]

      callbacks = @requests[data.method][data.uid]
      callback data.error, data.response for callback in callbacks


  send: (method, data, done) ->
    uid = JSON.stringify data

    @requests[method] ?= {}

    # Only send a request if there are no outstanding requests.
    unless @requests[method][uid]
      @requests[method][uid] = []
      process.send
        method: "cache:#{method}"
        data: data
        uid: uid

    @requests[method][json].push done

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

  del: (key, done) ->
    @send 'del', {key}, done


# Expose `DB`.
exports = module.exports = DB
