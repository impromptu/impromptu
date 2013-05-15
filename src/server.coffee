http = require 'http'
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
    options = JSON.parse body
    response.writeHead 200, "OK", {'Content-Type': 'text/plain'}

    impromptu = new Impromptu()
    if options.shell
      impromptu.options.prompt = options.shell

    impromptu.load()
    impromptu.prompt.build (err, results) ->
      response.write results if results
      response.end()

server.listen 1624
