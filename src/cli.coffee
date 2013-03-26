commander = require 'commander'

class CLI
  constructor: (options) ->
    # Options
    # - args       - A set of arguments to pass to the method, defaults to argv.
    # - connection - A connection to the socket server.
    #                Automatically overrides `done` and `write` to route through the server.
    options ?= {}
    @_async = false

    @args = options.args ? process.argv.slice 2
    @originalArgs = @args.slice()

    connection = options.connection
    if connection
      @write = connection.write.bind connection
      @done = connection.end.bind connection

    # Find the most specific function based on the provided commands.
    @command = CLI
    @command = @command[@args.shift()] while @args[0] && @command[@args[0]]
    @command = null if @command == CLI

    @argv = process.argv.slice(0, 2).concat @args

  # Run the command.
  run: ->
    @command.apply this, @args if @command

    if not @command
      CLI.help.outputHelp()

    @done() unless @_async

  # Register the process as asynchronous.
  # Returns a callback to indicate when the process is `done`.
  async: ->
    @_async = true
    return @done

  done: process.exit.bind process
  write: console.log.bind console

# Initialize a help command.
help = CLI.help = new commander.Command 'tu'
help.usage '<command>'

# Expose `Command`.
exports = module.exports = CLI;

# Expose APIs.
exports.db = require './cli/db'