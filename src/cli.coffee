Impromptu = require './impromptu'
path = require 'path'
nopt = require 'nopt'
_ = require 'underscore'

rcommand = /^(?:\w[\w-]*(?:\s+|$))*/


class CLI
  constructor: (options = {}) ->
    # Options
    # - args       - A set of arguments to pass to the method, defaults to argv.
    # - connection - A connection to the socket server.
    #                Automatically overrides `done` and `write` to route through the server.
    @args = options.args ? process.argv.slice 2
    @originalArgs = @args.slice()

    connection = options.connection
    if connection
      @write = connection.write.bind connection
      @done = connection.end.bind connection

    # Find the most specific function based on the provided commands.
    @command = CLI
    @command = @command.subcommands[@args.shift()] while @args[0] && @command.subcommands[@args[0]]
    @command = null if @command is CLI

    @argv = process.argv.slice(0, 2).concat @args

  # Run the command.
  run: ->
    @command?.run this
    @done() unless @_async

  # Register the process as asynchronous.
  # Returns a callback to indicate when the process is `done`.
  async: ->
    @_async = true
    @done

  done: process.exit.bind process
  write: console.log.bind console


class CLI.Command
  constructor: (@name) ->
    @alias = []
    @options = {}
    @subcommands = {}

  parse: (args) ->
    @desc = args.desc if args.desc
    @fn = args.fn if args.fn

    return unless args.options

    for option, value of args.options
      @options[option] = _.extend @options[option] || {}, value

  run: (cli) ->
    # Prepare options for nopt.
    optionTypes = {}
    for option, value of @options
      optionTypes[option] = value.type || String

    cli.args = nopt optionTypes, {}, cli.args, 0

    # Link the current command to the CLI instance.
    cli.command = this

    return unless @fn

    done = cli.async() if @fn.length
    @fn.call cli, done


CLI.command = (name, options) ->
  # Validate command.
  stack = rcommand.exec name
  return unless stack[0]

  scope = CLI
  stack = stack[0].trim().split ' '

  # Create any commands necessary to reach our desired subcommand.
  while stack.length
    name = stack.shift()
    scope.subcommands[name] ?= new CLI.Command name
    scope = scope.subcommands[name]

  scope.parse options


CLI.require = (filepath) ->
  fn = require path.resolve(filepath)
  fn.call Impromptu, Impromptu, CLI.command if typeof fn == 'function'


# Expose `CLI`.
exports = module.exports = CLI

# Expose APIs.
exports.subcommands = {}
CLI.require "#{__dirname}/cli/db"