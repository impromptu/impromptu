http = require 'http'
fork = require('child_process').fork
Impromptu = require '../lib/impromptu'

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
    child = fork "#{__dirname}/../lib/child.js"

    child.on 'message', (message) ->
      if message.type is 'prompt'
        response.writeHead 200, "OK", {'Content-Type': 'text/plain'}
        response.write message.data
        response.end()

    child.send
      type: 'options'
      data: body

server.listen 1624
