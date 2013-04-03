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

ansi = (code) ->
  "\x1B[#{code}m"

exports = module.exports = (string, format) ->
  original = string

  if format.foreground and COLORS[format.foreground]
    string = ansi(COLORS[format.foreground] + 30) + string

  if format.background and COLORS[format.background]
    string = ansi(COLORS[format.background] + 40) + string

  string = string + ansi(0) unless string is original
  string