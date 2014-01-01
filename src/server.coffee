net = require 'net'
fork = require('child_process').fork
Impromptu = require '../lib/impromptu'
path = require 'path'
fs = require 'fs'

pathOrPort = process.argv[2] || 1624
impromptu = new Impromptu
  verbosity: process.env.IMPROMPTU_LOG_LEVEL

childFactory =
  MAX_LENGTH: 2
  _queue: []

  _spawn: ->
    fork "#{__dirname}/../lib/child.js"

  refresh: ->
    while @_queue.length < @MAX_LENGTH
      @_queue.push @_spawn()

  get: ->
    if @_queue.length then @_queue.shift() else @_spawn()

childFactory.refresh()

server = net.createServer {allowHalfOpen: true}, (socket) ->
  # Verify that the client is running on the same version as the server.
  npmConfigPath = path.resolve "#{__dirname}/../package.json"
  npmConfig = JSON.parse fs.readFileSync(npmConfigPath)

  # If there's a version mismatch, stop running the server.
  if Impromptu.VERSION isnt npmConfig.version
    socket.end()

    # Remove the server's pid file.
    fs.unlinkSync impromptu.path.serverPid
    process.exit()
    return


  # Build the body.
  body = ''
  socket.on 'data', (data) ->
    body += data

    # Make sure the server isn't being flooded.
    if body.length > 1e6
      body = ''
      socket.end()
      socket.destroy()

  socket.on 'end', ->
    child = childFactory.get()

    child.on 'message', (message) ->
      if message.type is 'prompt'
        socket.end message.data
        # TODO: Call this when the child has exited (or disconnect from the
        # child at this point, and create a different system to handle any orphaned
        # or long-running background refreshes).
        childFactory.refresh()

    child.send
      type: 'env'
      data: body

server.listen pathOrPort
