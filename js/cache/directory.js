// TODO: Update for style, copy comments.
var Directory, Impromptu, exports,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

Impromptu = require('../impromptu');

Directory = (function(_super) {
  __extends(Directory, _super);

  function Directory(impromptu, name, options) {
    var directory;

    if (options == null) {
      options = {};
    }
    directory = options.directory || process.env.PWD;
    name = "" + name + ":" + directory;
    Directory.__super__.constructor.call(this, impromptu, name, options);
  }

  return Directory;

})(Impromptu.Cache.Global);

exports = module.exports = Directory;
