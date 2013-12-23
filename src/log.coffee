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

  setVerbosity: (level) ->
    @_verbosity = Log.Levels.WARNING if level is 'warning'
    @_verbosity = Log.Levels.NOTICE if level is 'notice'
    @_verbosity = Log.Levels.DEBUG if level is 'debug'

  write: (level, message) ->
    return if level > @_verbosity

    delimiter = if Log.Delimiters[level] then "#{Log.Delimiters[level]} " else ''

    fs.appendFileSync @impromptu.path.log,
      "[#{process.pid}] #{new Date().toISOString()} #{delimiter}#{message}"

  warning: (message) ->
    @write Log.Levels.WARNING, message

  notice: (message) ->
    @write Log.Levels.NOTICE, message

  debug: (message) ->
    @write Log.Levels.DEBUG, message

# Expose `Log`.
exports = module.exports = Log
