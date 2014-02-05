var fs = require('fs');
var path = require('path');
var util = require('util');
var _ = require('underscore');

var npmConfig = require('../package.json');

function Impromptu(options) {
  var config, ext, verbosity;

  this.options = options != null ? options : {};
  config = this.options.config || Impromptu.DEFAULT_CONFIG_DIR;
  delete this.options.config;
  verbosity = this.options.verbosity;
  delete this.options.verbosity;
  this.path = {
    config: config,
    sources: (function() {
      var _i, _len, _ref, _results;

      _ref = ['coffee', 'js'];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        ext = _ref[_i];
        _results.push("" + config + "/prompt." + ext);
      }
      return _results;
    })(),
    compiled: "" + config + "/.compiled/prompt.js",
    log: "" + config + "/impromptu-debug.log"
  };
  if (this.options.serverId) {
    this.path.serverPid = "" + config + "/.compiled/impromptu-node-server-" + this.options.serverId + ".pid";
  }
  this.log = new Impromptu.Log(this, verbosity);
  this.color = new Impromptu.Color(this);
  this.repository = new Impromptu.RepositoryFactory(this);
  this.db = new Impromptu.DB(this);
  this.module = new Impromptu.ModuleFactory(this);
  this.prompt = new Impromptu.Prompt(this);
  this._compilePrompt();
}

Impromptu.VERSION = npmConfig.version;
Impromptu.DEFAULT_CONFIG_DIR = process.env.IMPROMPTU_DIR || ("" + process.env.HOME + "/.impromptu");

Impromptu.prototype.load = function() {
  var err, prompt;

  if (!this._compilePrompt()) {
    return this;
  }
  prompt = require(this.path.compiled);
  try {
    if (typeof prompt.call === "function") {
      prompt.call(this, Impromptu, this.prompt.section);
    }
  } catch (_error) {
    err = _error;
    this._error('javascript', 'Your prompt file triggered a JavaScript error.', err);
  }
  return this;
};

Impromptu.prototype._compilePrompt = function() {
  var coffee, compiledDir, compiledJs, compiledMtime, err, sourceMtime, sourcePrompt;

  if (!(sourcePrompt = _.find(this.path.sources, function(path) {
    return fs.existsSync(path);
  }))) {
    return;
  }
  if (fs.existsSync(this.path.compiled)) {
    sourceMtime = fs.statSync(sourcePrompt).mtime;
    compiledMtime = fs.statSync(this.path.compiled).mtime;
    if (sourceMtime < compiledMtime) {
      return true;
    }
  }
  compiledDir = path.dirname(this.path.compiled);
  if (!fs.existsSync(compiledDir)) {
    fs.mkdir(compiledDir);
  }
  if (/\.js$/.test(sourcePrompt)) {
    fs.createReadStream(sourcePrompt).pipe(fs.createWriteStream(this.path.compiled));
    return true;
  } else if (/\.coffee$/.test(sourcePrompt)) {
    this._clearError('coffeescript');
    coffee = require('coffee-script');
    try {
      compiledJs = coffee.compile(fs.readFileSync(sourcePrompt).toString());
      fs.writeFileSync(this.path.compiled, compiledJs);
      return true;
    } catch (_error) {
      err = _error;
      this._error('coffeescript', 'Your prompt file is not valid CoffeeScript.', err);
    }
  }
};

Impromptu.prototype._error = function(name, content, err) {
  this.prompt.section("error:message:" + name, {
    content: content,
    background: 'red',
    foreground: 'white'
  });
  this.prompt.section("error:instructions:" + name, {
    content: "\nDetails can be found in " + this.path.log + "\n",
    options: {
      newlines: true
    }
  });
  return this.log.warning("" + content + "\n\n" + err.stack + "\n----------------------------------------");
};

Impromptu.prototype._clearError = function(name) {
  this.prompt.section("error:message:" + name, {
    content: ''
  });
  return this.prompt.section("error:instructions:" + name, {
    content: ''
  });
};


Impromptu.Error = function Error(message) {
  this.message = message
  Error.apply(this, arguments)
}
util.inherits(Impromptu.Error, Error)


Impromptu.AbstractError = function AbstractError(message) {
  this.message = message;
  if (!this.message) {
    this.message = 'This method should be defined in a subclass.';
  }
  Impromptu.Error.apply(this, arguments)
}
util.inherits(Impromptu.AbstractError, Impromptu.Error)


Impromptu.exec = require('./exec');
Impromptu.Color = require('./color');
Impromptu.Cache = require('./cache/base');
Impromptu.Cache.Shim = require('./cache/shim');
Impromptu.Cache.Instance = require('./cache/instance');
Impromptu.Cache.Global = require('./cache/global');
Impromptu.Cache.Directory = require('./cache/directory');
Impromptu.Cache.Repository = require('./cache/repository');
Impromptu.DB = require('./db');
Impromptu.Log = require('./log');
Impromptu.ModuleFactory = require('./module');
Impromptu.Prompt = require('./prompt');
Impromptu.RepositoryFactory = require('./repository');

module.exports = Impromptu;
