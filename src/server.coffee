net = require 'net'
fork = require('child_process').fork
Impromptu = require '../lib/impromptu'
path = require 'path'
fs = require 'fs'

pathOrPort = process.argv[2] || 1624
impromptu = new Impromptu
  verbosity: process.env.IMPROMPTU_LOG_LEVEL

prompt =
  BUFFER_SIZE: 2
  buffer: []

  spawn: ->
    fork "#{__dirname}/../lib/child.js"

  refresh: ->
    while @buffer.length < @BUFFER_SIZE
      @buffer.push @spawn()

  get: ->
    if @buffer.length then @buffer.shift() else @spawn()

prompt.refresh()

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
    child = prompt.get()

    child.on 'message', (message) ->
      if message.type is 'prompt'
        socket.end message.data
        prompt.refresh()

    child.send
      type: 'env'
      data: body

server.listen pathOrPort
