net = require 'net'
fork = require('child_process').fork
Impromptu = require '../lib/impromptu'
path = require 'path'
fs = require 'fs'
minimist = require 'minimist'

argv = minimist process.argv.slice(2),
  defaults:
    logfile: true
    foreground: false
  alias:
    h: 'help'
    v: 'version'

impromptu = new Impromptu
  processType: 'server'
  verbosity: argv.verbosity

impromptu.log.defaultDestinations.server = argv.foreground
impromptu.log.defaultDestinations.file = argv.logfile


cache =
  _store: {}

  get: (data) ->
    result = cache._store[data.key]
    return unless result

    if Date.now() < result.expireAt
      data.value
    else
      cache.del data
      return # undefined

  set: (data) ->
    cache._store[data.key] =
      value: data.value
      expireAt: Date.now() + data.expire * 1000

  del: (data) ->
    delete cache._store[data.key] # returns true

  listen: (child) ->
    child.on 'message', (message) ->
      switch message.type
        when 'cache:get' then response = cache.get message.data
        when 'cache:set' then response = cache.set message.data
        when 'cache:del' then response = cache.del message.data

      child.send
        type: 'cache:response'
        data:
          uid: message.data.uid
          response: response


childFactory =
  MAX_LENGTH: 2
  _queue: []

  _spawn: ->
    child = fork "#{__dirname}/../lib/child.js", process.argv.slice(2)
    cache.listen(child)

  refresh: ->
    while @_queue.length < @MAX_LENGTH
      @_queue.push @_spawn()

  get: ->
    if @_queue.length then @_queue.shift() else @_spawn()

# Safely shut down the server.
shutdown = ->
  server.close ->
    process.exit()

# Clean up after ourselves before the process exits.
process.on 'exit', ->
  # Shut down the Redis server.
  impromptu.db.shutdown()

  # Remove the Impromptu server's pid file.
  fs.unlinkSync impromptu.path.serverPid
  # TODO: If the server is using a Unix domain socket, remove the socket file here.

# Gracefully shut down on Ctrl+C.
process.on 'SIGINT', ->
  shutdown()

# Prepare to create the server.
# -----------------------------

# Write the server's PID to a file.
fs.writeFileSync impromptu.path.serverPid, process.pid

# Ensure the Redis server is running.
impromptu.db.client()

# Build the queue of child processes.
childFactory.refresh()

# Create the server.
server = net.createServer {allowHalfOpen: true}, (socket) ->
  # Verify that the client is running on the same version as the server.
  npmConfigPath = path.resolve "#{__dirname}/../package.json"
  npmConfig = JSON.parse fs.readFileSync(npmConfigPath)

  # If there's a version mismatch, stop running the server.
  if Impromptu.VERSION isnt npmConfig.version
    socket.end()
    shutdown()
    return

  # Build the body.
  # The body can be:
  # * A newline delimited representation of the shell environment (as formatted
  #   by printenv: each line is equal to "KEY=value").
  # * The string 'shutdown'.
  body = ''
  socket.on 'data', (data) ->
    body += data

    # Make sure the server isn't being flooded.
    if body.length > 1e6
      body = ''
      socket.end()
      socket.destroy()

  socket.on 'end', ->
    if body is 'shutdown'
      socket.end()
      shutdown()
      return

    child = childFactory.get()

    child.on 'message', (message) ->
      if message.type is 'prompt'
        socket.end message.data
        # TODO: Call this when the child has exited (or disconnect from the
        # child at this point, and create a different system to handle any orphaned
        # or long-running background refreshes).
        childFactory.refresh()

      else if message.type is 'log:stdout'
        socket.write "#{message.data}\n"

      else if message.type is 'log:server'
        console.log message.data

    child.send
      type: 'env'
      data: body

server.listen argv.path || argv.port
