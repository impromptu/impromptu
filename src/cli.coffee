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
    @command = null if @command == CLI or @command == CLI.help

    @argv = process.argv.slice(0, 2).concat @args

  # Run the command.
  run: ->
    @command.apply this, @args if @command

    if not @command
      CLI._help.outputHelp()

    @done() unless @_async

  # Register the process as asynchronous.
  # Returns a callback to indicate when the process is `done`.
  async: ->
    @_async = true
    return @done

  done: process.exit.bind process
  write: console.log.bind console

# Initialize a help command.
_help = CLI._help = new commander.Command 'tu'
_help.usage '<command>'

CLI.help = (command, description) ->
  _help.command(command).description(description)
  CLI

# Expose `Command`.
exports = module.exports = CLI;

# Expose APIs.
exports.db = require './cli/db'