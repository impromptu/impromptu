var Impromptu, exec, exports, _Command, _registry;

Impromptu = require('./impromptu');

exec = require('child_process').exec;

_registry = {};

_Command = (function() {
  function _Command(command) {
    var _this = this;

    this.command = command;
    this.callbacks = [];
    exec(this.command, function() {
      var fn, _i, _len, _ref, _results;

      _this.results = arguments;
      _ref = _this.callbacks;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        fn = _ref[_i];
        _results.push(fn.apply(Impromptu, arguments));
      }
      return _results;
    });
  }

  return _Command;

})();

exports = module.exports = function(command, fn) {
  var cached;

  cached = _registry[command];
  if (!cached) {
    cached = _registry[command] = new _Command(command);
  }
  if (cached.results) {
    fn.apply(Impromptu, cached.results);
  } else {
    cached.callbacks.push(fn);
  }
  return null;
};
