http = require 'http'
fork = require('child_process').fork
Impromptu = require '../lib/impromptu'

port = process.argv[2] || 1624

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

server = http.createServer (request, response) ->
  if request.method isnt 'POST'
    response.writeHead(405, {'Content-Type': 'text/plain'}).end()
    return

  # Build the body.
  body = ''
  request.on 'data', (data) ->
    body += data

    # Make sure the server isn't being flooded.
    if body.length > 1e6
      body = ''
      response.writeHead(413, {'Content-Type': 'text/plain'}).end()
      request.connection.destroy()

  request.on 'end', ->
    child = prompt.get()

    child.on 'message', (message) ->
      if message.type is 'prompt'
        response.writeHead 200, "OK", {'Content-Type': 'text/plain'}
        response.write message.data
        response.end()
        prompt.refresh()

    child.send
      type: 'env'
      data: body

server.listen port
