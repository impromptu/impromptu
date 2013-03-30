commander = require 'commander'
Impromptu = require './impromptu'
path = require 'path'

rcommand = /^(?:\w[\w-]*(?:\s+|$))*/

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
    @command = CLI.commands
    @command = @command[@args.shift()] while @args[0] && @command[@args[0]]
    @command = null unless typeof @command == 'function'

    @argv = process.argv.slice(0, 2).concat @args

  # Run the command.
  run: ->
    @command.apply this, @args if @command
    CLI._help.outputHelp() unless @command

    @done() unless @_async

  # Register the process as asynchronous.
  # Returns a callback to indicate when the process is `done`.
  async: ->
    @_async = true
    @done

  done: process.exit.bind process
  write: console.log.bind console


# Initialize a help command.
_help = CLI._help = new commander.Command 'tu'
_help.usage '<command>'


CLI.help = (command, description) ->
  _help.command(command).description(description)
  CLI


CLI.command = (name, description, fn) ->
  CLI.help name, description

  # Validate command.
  stack = rcommand.exec name
  return unless stack[0]

  scope = CLI.commands
  stack = stack[0].trim().split ' '

  while stack.length > 1
    scope = scope[stack.shift()] ?= {}

  scope[stack.shift()] = ->
    command = new commander.Command('tu ' + name)
    command.usage ' '
    fn.call this, command
    command.parse @argv


CLI.require = (filepath) ->
  fn = require path.resolve(filepath)
  fn.call Impromptu, Impromptu, CLI.command if typeof fn == 'function'


# Expose `CLI`.
exports = module.exports = CLI

# Expose APIs.
exports.commands = {}
CLI.require __dirname + '/cli/db'