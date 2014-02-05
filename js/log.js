var Impromptu = require('./impromptu');
var fs = require('fs');

function Log(impromptu, verbosity) {
  this.impromptu = impromptu;
  this._verbosity = Log.Levels.NOTICE;
  this.setVerbosity(verbosity);
  this.defaultDestinations = {
    file: true,
    server: false,
    stdout: false
  };
}

Log.Levels = {
  WARNING: 1,
  NOTICE: 2,
  DEBUG: 3
};

Log.Delimiters = {
  1: '#',
  2: '*',
  3: '-'
};

Log.prototype.setVerbosity = function(level) {
  if (level === 'warning') {
    this._verbosity = Log.Levels.WARNING;
  }
  if (level === 'notice') {
    this._verbosity = Log.Levels.NOTICE;
  }
  if (level === 'debug') {
    return this._verbosity = Log.Levels.DEBUG;
  }
};

Log.prototype.output = function(message) {
  return this.write(message, {
    level: null,
    format: false,
    destinations: {
      file: false,
      server: false,
      stdout: true
    }
  });
};

Log.prototype.warning = function(message) {
  return this.write(message, {
    level: Log.Levels.WARNING,
    format: true,
    destinations: this.defaultDestinations
  });
};

Log.prototype.notice = function(message) {
  return this.write(message, {
    level: Log.Levels.NOTICE,
    format: true,
    destinations: this.defaultDestinations
  });
};

Log.prototype.debug = function(message) {
  return this.write(message, {
    level: Log.Levels.DEBUG,
    format: true,
    destinations: this.defaultDestinations
  });
};

Log.prototype.write = function(message, options) {
  var destinations;

  if (options.level && options.level > this._verbosity) {
    return;
  }
  destinations = options.destinations || this.defaultDestinations;
  if (options.format) {
    message = this.format(message, options.level);
  }
  if (destinations.stdout) {
    this._writeToStdoutRaw(message);
  }
  if (destinations.server) {
    this._writeToServerRaw(message);
  }
  if (destinations.file) {
    return this._writeToFileRaw(message);
  }
};

Log.prototype.format = function(message, level) {
  var delimiter;

  delimiter = Log.Delimiters[level] ? "" + Log.Delimiters[level] + " " : '';
  return "[" + process.pid + "] " + (new Date().toISOString()) + " " + delimiter + message;
};

Log.prototype._writeToFileRaw = function(message) {
  return fs.appendFileSync(this.impromptu.path.log, message);
};

Log.prototype._writeToStdoutRaw = function(message) {
  if (process.send) {
    return process.send({
      type: 'write',
      data: "" + message + "\n"
    });
  } else {
    return console.log(message);
  }
};

Log.prototype._writeToServerRaw = function(message) {
  return console.log(message);
};

module.exports = Log;
