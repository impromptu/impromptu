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
  verbosity: argv.verbosity

impromptu.log.defaultDestinations.server = argv.foreground
impromptu.log.defaultDestinations.file = argv.logfile


cache =
  _store: {}

  get: (data) ->
    result = cache._store[data.key]
    return unless result

    if not result.expireAt or Date.now() < result.expireAt
      result.value
    else
      cache.del data
      return # undefined

  set: (data) ->
    result =
      value: data.value

    if data.expire
      result.expireAt = Date.now() + data.expire * 1000

    cache._store[data.key] = result


  del: (data) ->
    delete cache._store[key] for key in data.keys
    true

  listen: (child) ->
    child.on 'message', (message) ->
      return unless message.type is 'cache:request'

      data = message.data
      response = cache[data.method] data
      child.send
        type: 'cache:response'
        data:
          method: data.method
          uid: data.uid
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

    # Bind message listeners that use the socket.
    child.on 'message', (message) ->
      if message.type is 'write'
        socket.write message.data

      else if message.type is 'end'
        socket.end message.data
        # TODO: Call this when the child has exited (or disconnect from the
        # child at this point, and create a different system to handle any orphaned
        # or long-running background refreshes).
        childFactory.refresh()

    if body is 'test'
      child.send
        type: 'test'

      child.on 'message', (message) ->
        if message.type is 'shutdown'
          shutdown()
          socket.end()
    else
      child.send
        type: 'env'
        data: body

server.listen argv.path || argv.port
