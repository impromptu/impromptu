(function() {
  var COLORS, Color, exports, _;

  _ = require('underscore');

  COLORS = {
    black: 0,
    red: 1,
    green: 2,
    yellow: 3,
    blue: 4,
    magenta: 5,
    cyan: 6,
    white: 7,
    "default": 9
  };

  Color = (function() {
    function Color(impromptu) {
      this.impromptu = impromptu;
    }

    Color.prototype.format = function(string, options) {
      var original;

      original = string;
      if (options.foreground && _.has(COLORS, options.foreground)) {
        string = this.ansi(COLORS[options.foreground] + 30) + string;
      }
      if (options.background && _.has(COLORS, options.background)) {
        string = this.ansi(COLORS[options.background] + 40) + string;
      }
      if (string !== original) {
        string = string + this.ansi(0);
      }
      return string;
    };

    Color.prototype.ansi = function(code) {
      switch (this.impromptu.options.shell) {
        case 'bash':
          return "\\[\\033[" + code + "m\\]";
        case 'zsh':
          return "%{\x1B[" + code + "m%}";
        default:
          return "\x1B[" + code + "m";
      }
    };

    return Color;

  })();

  exports = module.exports = Color;

}).call(this);
