Impromptu = require './impromptu'
fs = require 'fs'

class Log
  # The log verbosity level.
  #
  # Do not refer to these numbers directly, use their corresponding key-names instead.
  # Inspired by the Redis log levels.
  #
  # Log levels:
  #   warning (only very important / critical messages are logged)
  #   notice (moderately verbose, what you want in production probably)
  #   debug (a lot of information, useful for development/testing)
  @Levels:
    WARNING: 1
    NOTICE: 2
    DEBUG: 3

  @Delimiters:
    1: '#'
    2: '*'
    3: '-'

  constructor: (@impromptu, verbosity) ->
    @_verbosity = Log.Levels.NOTICE
    @setVerbosity verbosity

    @defaultDestinations =
      file: true
      server: false
      stdout: false

  setVerbosity: (level) ->
    @_verbosity = Log.Levels.WARNING if level is 'warning'
    @_verbosity = Log.Levels.NOTICE if level is 'notice'
    @_verbosity = Log.Levels.DEBUG if level is 'debug'

  output: (message) ->
    @write message,
      level: null
      format: false
      destinations:
        file: false
        server: false
        stdout: true

  warning: (message) ->
    @write message,
      level: Log.Levels.WARNING
      format: true
      destinations: @defaultDestinations

  notice: (message) ->
    @write message,
      level: Log.Levels.NOTICE
      format: true
      destinations: @defaultDestinations

  debug: (message) ->
    @write message,
      level: Log.Levels.DEBUG
      format: true
      destinations: @defaultDestinations

  # Low-level method to write output and logs.
  # Accepts a message and an options object.
  #
  # options.level - Integer. Specifies the log level of the message.
  #                 Optional. Messages without a specified level will always be written.
  #
  # options.format - Boolean. Whether the message should be formatted.
  #
  # options.destinations - Whether the message should be written to various destiations.
  #                        An object with three boolean keys: 'file', 'server', and 'stdout'.
  #                        Optional, defaults to `this.defaultDestinations`.
  write: (message, options) ->
    return if options.level and options.level > @_verbosity
    destinations = options.destinations or @defaultDestinations

    if options.format
      message = @format message, options.level

    if destinations.stdout
      @_writeToStdoutRaw message

    if destinations.server
      @_writeToServerRaw message

    if destinations.file
      @_writeToFileRaw message

  format: (message, level) ->
    delimiter = if Log.Delimiters[level] then "#{Log.Delimiters[level]} " else ''
    "[#{process.pid}] #{new Date().toISOString()} #{delimiter}#{message}"

  _writeToFileRaw: (message) ->
    fs.appendFileSync @impromptu.path.log, message

  _writeToStdoutRaw: (message) ->
    if process.send
      process.send
        type: 'write'
        data: "#{message}\n"
    else
      console.log message

  _writeToServerRaw: (message) ->
    console.log message

# Expose `Log`.
exports = module.exports = Log
