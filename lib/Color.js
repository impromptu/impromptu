var _ = require('underscore')

/**
 * Colors that can be used to color background/foreground of a string.
 * The keys of this object are used as arguments to `Color.format`.
 * @enum {number}
 */
var COLORS = {
  black: 0,
  red: 1,
  green: 2,
  yellow: 3,
  blue: 4,
  magenta: 5,
  cyan: 6,
  white: 7,
  "default": 9
}

/**
 * Applies color codes with proper escape codes for standard shell, bash prompts, or zsh prompts.
 * @constructor
 */
function Color(impromptu) {
  this.impromptu = impromptu
}

/**
 * Formats a string by wrapping it with specific color codes.
 * Can color both the foreground and background of a string.
 * The ansi color codes are generated based on the configured shell.
 *
 * @param {string} string
 * @param {{foreground: (string|undefined), background: (string|undefined)}} options
 * @return {string} The formatted string.
 */
Color.prototype.format = function(string, options) {
  var original = string
  if (options.foreground && _.has(COLORS, options.foreground)) {
    string = this.ansi(COLORS[options.foreground] + 30) + string
  }
  if (options.background && _.has(COLORS, options.background)) {
    string = this.ansi(COLORS[options.background] + 40) + string
  }
  if (string !== original) {
    string = string + this.ansi(0)
  }
  return string
}

/**
 * Outputs an ansi string based on the provided code and the configured shell.
 * @param {number} code
 * @return {string}
 */
Color.prototype.ansi = function(code) {
  switch (this.impromptu.state.get('shell')) {
    case 'bash':
      return "\\[\\033[" + code + "m\\]"
    case 'zsh':
      return "%{\x1B[" + code + "m%}"
    default:
      return "\x1B[" + code + "m"
  }
}

module.exports = Color
