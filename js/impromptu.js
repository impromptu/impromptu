var fs = require('fs');
var path = require('path');
var util = require('util');
var _ = require('underscore');

// Load our own package.json
var npmConfig = require('../package.json');

function Impromptu(options) {
  this.options = options != null ? options : {};

  var config = this.options.config || Impromptu.DEFAULT_CONFIG_DIR;
  delete this.options.config;

  var verbosity = this.options.verbosity;
  delete this.options.verbosity;

  this.path = {
    config: config,
    sources: [config + '/prompt.coffee', config + '/prompt.js'],
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

  // Attempt to compile the prompt in advance (if necessary).
  this._compilePrompt();
}

Impromptu.VERSION = npmConfig.version;
Impromptu.DEFAULT_CONFIG_DIR = process.env.IMPROMPTU_DIR || ("" + process.env.HOME + "/.impromptu");

Impromptu.prototype.load = function() {
  // Ensure the prompt is compiled.
  // Double-check that nothing has changed since Impromptu was instantiated.
  if (!this._compilePrompt()) return this;

  // Load the prompt file.
  var prompt = require(this.path.compiled);
  try {
    if (typeof prompt.call === 'function') {
      prompt.call(this, Impromptu, this.prompt.section)
    }
  } catch (err) {
    this._error('javascript', 'Your prompt file triggered a JavaScript error.', err)
  }
  return this;
};

// Returns true if the compiled prompt file exists.
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

    // Allow `.coffee` files in `require()`.
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
