path = require 'path'
net = require 'net'
spawn = require('child_process').spawn
Impromptu = require './impromptu'

# Create a new server.
server = net.createServer (connection) ->
  connection.on 'data', (input) ->
    input = input.toString().trim()
    if input == 'exit'
      process.exit()

    # Split the command back into its components.
    args = input.split '__IMPROMPTU__'

    # Find the most specific function based on the provided commands.
    command = Impromptu
    command = command[args.shift()] while args[0] && command[args[0]]

    # Run the command.
    command.apply this, args unless command == Impromptu

    # Output the command and close the connection.
    connection.end()

# Generate the socket path for this process.
socketPath = path.resolve __dirname + '/../etc/' + process.pid + '.sock'
proxyPath = path.resolve __dirname + '/../bin/tu-proxy'

# Point the server at the socket.
server.listen socketPath, ->
  # When the server is connected, launch the proxied `tu` script.
  spawn proxyPath, [socketPath], {stdio: 'inherit'}
