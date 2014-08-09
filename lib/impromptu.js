var events = require('events')
var fs = require('fs')
var path = require('path')
var util = require('util')
var _ = require('underscore')

// Load our own package.json
var npmConfig = require('../package.json')


/**
 * The base Impromptu class.
 * @constructor
 * @extends {events.EventEmitter}
 */
function Impromptu() {
  events.EventEmitter.call(this)

  this.config = new Impromptu.Config()
  this._setRootPath(Impromptu.DEFAULT_CONFIG_DIR)

  this.log = new Impromptu.Log(this)
  this.color = new Impromptu.Color(this)
  this.repository = new Impromptu.RepositoryFactory(this)
  this.db = new Impromptu.DB(this)
  this.module = new Impromptu.ModuleFactory(this)
  this.plugin = new Impromptu.PluginFactory(this)
  this.prompt = new Impromptu.Prompt(this)

  this.setMaxListeners(200)
}
util.inherits(Impromptu, events.EventEmitter)

/**
 * Set paths to files in the impromptu config directory.
 * @param {string} rootPath Impromptu config directory
 * @private
 */
Impromptu.prototype._setRootPath = function (rootPath) {
  var tempDirName = 'tmp'

  this.config.set('path.root', rootPath)
  this.config.set('path.promptCoffee', path.join(rootPath, 'prompt.coffee'))
  this.config.set('path.promptJs', path.join(rootPath, 'prompt.js'))
  this.config.set('path.tmp', path.join(rootPath, tempDirName))
  this.config.set('path.compiledPrompt', path.join(rootPath, tempDirName, 'prompt.js'))
  this.config.set('path.log', path.join(rootPath, 'impromptu-debug.log'))
  this.config.set('path.nodeModules', path.join(rootPath, 'node_modules'))
}

/**
 * Get the path to the server PID file.
 * @return {string}
 */
Impromptu.prototype.getServerPidPath = function () {
  var serverId = this.config.get('serverId')
  if (!serverId) {
    throw new Error('Missing Impromptu server ID')
  }

  return path.join(this.config.get('path.tmp'), 'server-' + serverId + '.pid')
}

/** @const {string} */
Impromptu.VERSION = npmConfig.version

/** @const {string} */
Impromptu.DEFAULT_CONFIG_DIR = process.env.IMPROMPTU_DIR || ("" + process.env.HOME + "/.impromptu")

// Utilities.
Impromptu.Config = require('./config')
Impromptu.Error = require('./error')
Impromptu.exec = require('./exec')

// APIs.
Impromptu.Color = require('./color')
Impromptu.Cache = require('./cache/base')
Impromptu.Cache.Shim = require('./cache/shim')
Impromptu.Cache.Instance = require('./cache/instance')
Impromptu.Cache.Global = require('./cache/global')
Impromptu.Cache.Directory = require('./cache/directory')
Impromptu.Cache.Repository = require('./cache/repository')
Impromptu.DB = require('./db')
Impromptu.Log = require('./log')
Impromptu.ModuleFactory = require('./module')
Impromptu.PluginFactory = require('./plugin')
Impromptu.Prompt = require('./prompt')
Impromptu.RepositoryFactory = require('./repository')

/**
 * A helper to return the Impromptu version.
 * @return {string}
 */
Impromptu.prototype.version = function() {
  return Impromptu.VERSION
}

Impromptu.prototype.exec = Impromptu.exec

/**
 * Requires the prompt file, compiling it if necessary.
 */
Impromptu.prototype.load = function() {
  // Ensure the prompt is compiled.
  // Double-check that nothing has changed since Impromptu was instantiated.
  if (!this._compilePrompt()) return

  // Load the prompt file.
  try {
    var prompt = require(this.config.get('path.compiledPrompt'))
    if (typeof prompt.call === 'function') {
      this._prompt = prompt
    } else {
      this._error('needs-function', 'Your prompt file should export a function.', new Error())
    }
  } catch (err) {
    this._error('javascript', 'Your prompt file triggered a JavaScript error.', err)
  }
}

/**
 * Build the prompt.
 * Emits the "build" event.
 *
 * NOTE: The "build" event is utilized by the PluginFactory. Instead of using an event, perhaps
 * claim an "initialize" method from the factory, since it's the only user.
 *
 * @param {function(Error,string)} done Called when the prompt is built.
 */
Impromptu.prototype.build = function(done) {
  if (this._prompt) {
    try {
      this.emit('build')
      this._prompt.call(this, Impromptu, this.prompt.section)
    } catch (err) {
      this._error('javascript', 'Your prompt method triggered a JavaScript error.', err)
    }
  }

  this.prompt.build(done)
}

/**
 * Generates a fallback prompt.
 * Use when prompt generation fails.
 * @param {string=} opt_message If provided, wrapped in brackets and prepended to the fallback.
 * @return {string}
 */
Impromptu.prototype.fallback = function(opt_message) {
  var message = opt_message ? '[' + opt_message + '] ' : ''
  return message + (process.cwd()) + ' $ '
}

/**
 * Checks if a prompt file exists, compiling it if necessary.
 * @return {boolean} Whether the compiled prompt file exists.
 * @private
 */
Impromptu.prototype._compilePrompt = function() {
  var promptPaths = [this.config.get('path.promptCoffee'), this.config.get('path.promptJs')]
  var sourcePromptPath = _.find(promptPaths, function(path) {
    return fs.existsSync(path)
  })

  // Make sure we have a source prompt.
  // If we don't find a prompt file, bail.
  if (!sourcePromptPath) return false

  // Check whether the compiled prompt exists and is up to date.
  var compiledPromptPath = this.config.get('path.compiledPrompt')
  if (fs.existsSync(compiledPromptPath)) {
    var sourceMtime = fs.statSync(sourcePromptPath).mtime
    var compiledMtime = fs.statSync(compiledPromptPath).mtime

    if (sourceMtime < compiledMtime) return true
  }

  // Ensure the compiled prompt directory exists.
  var compiledDir = path.dirname(compiledPromptPath)
  if (!fs.existsSync(compiledDir)) fs.mkdir(compiledDir)

  // If your prompt is already JS, just copy it over.
  if (/\.js$/.test(sourcePromptPath)) {
    fs.createReadStream(sourcePromptPath).pipe(fs.createWriteStream(compiledPromptPath))
    return true

  // If you're using CoffeeScript, load the CoffeeScript module to compile and cache it.
  } else if (/\.coffee$/.test(sourcePromptPath)) {
    // Clear any pre-existing CoffeeScript compiler errors.
    // We only care about whether the most recent compilation succeeded.
    this._clearError('coffeescript')

    // Allow `.coffee` files in `require()`.
    var coffee = require('coffee-script')
    try {
      var compiledJs = coffee.compile(fs.readFileSync(sourcePromptPath).toString())
      fs.writeFileSync(compiledPromptPath, compiledJs)
      return true
    } catch (err) {
      this._error('coffeescript', 'Your prompt file is not valid CoffeeScript.', err)
    }
  }
  return false
}

/**
 * Outputs an error prompt and logs the error.
 *
 * @param {string} key The key to identify the error section.
 * @param {string} content
 * @param {Error} err
 * @private
 */
Impromptu.prototype._error = function(key, content, err) {
  this.prompt.section("error:message:" + key, {
    content: content,
    background: 'red',
    foreground: 'white'
  })

  this.prompt.section("error:instructions:" + key, {
    content: "\nDetails can be found in " + this.config.get('path.log') + "\n",
    options: {
      newlines: true
    }
  })

  this.log.error(content, err)
}

/**
 * Clears an error prompt for a provided key.
 * @param {string} key The key to identify the error section.
 * @private
 */
Impromptu.prototype._clearError = function(key) {
  this.prompt.section("error:message:" + key, {
    content: ''
  })

  this.prompt.section("error:instructions:" + key, {
    content: ''
  })
}

/**
 * Expose an instance of Impromptu by default.
 *
 * For testing, we can override the global instance using the `setGlobalInstance` method.
 * Otherwise, you should just treat this instance as global, as if the following block read:
 *   `module.exports = new Impromptu()`
 */
Impromptu.prototype.setGlobalInstance = (function () {
  var globalImpromptuInstance = new Impromptu()

  Object.defineProperty(module, 'exports', {
    get: function () {
      return globalImpromptuInstance
    }
  })

  return function (impromptuInstance) {
    if (impromptuInstance instanceof Impromptu) {
      globalImpromptuInstance = impromptuInstance
    }
  }
}())
