_ = require 'underscore'

COLORS =
  black: 0
  red: 1
  green: 2
  yellow: 3
  blue: 4
  magenta: 5
  cyan: 6
  white: 7
  default: 9

class Color
  constructor: (@impromptu) ->

  format: (string, options) ->
    original = string

    if options.foreground and _.has COLORS, options.foreground
      string = @ansi(COLORS[options.foreground] + 30) + string

    if options.background and _.has COLORS, options.background
      string = @ansi(COLORS[options.background] + 40) + string

    string = string + @ansi(0) unless string is original
    string

  ansi: (code) ->
    if @impromptu.options.prompt
      "\\[\\033[#{code}m\\]"
    else
      "\x1B[#{code}m"

exports = module.exports = Color
