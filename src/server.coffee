path = require 'path'
net = require 'net'
spawn = require('child_process').spawn

# Create a new server.
server = net.createServer (connection) ->
  connection.on 'data', (chunk) ->
    chunk = chunk.toString().trim()
    if chunk == 'exit'
      process.exit()

  # Automatically close the connection for now.
  connection.end 'Hello, world!\n'

# Generate the socket path for this process.
socketPath = path.resolve __dirname + '/../etc/' + process.pid + '.sock'
proxyPath = path.resolve __dirname + '/../bin/tu-proxy'

# Point the server at the socket.
server.listen socketPath, ->
  # When the server is connected, launch the proxied `tu` script.
  spawn proxyPath, [socketPath], {stdio: 'inherit'}
