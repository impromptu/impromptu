var Impromptu = require('./impromptu');
var path = require('path');
var exec = require('child_process').exec;


function Module(impromptu, factory, name, initialize) {
  this.impromptu = impromptu;
  this.factory = factory;
  this.name = name;
  this.register = this.register.bind(this);
  this._methods = {};
  initialize.call(this.impromptu, Impromptu, this.register, this._methods);
}

Module.prototype.register = function(key, options) {
  if (typeof options.cache === 'undefined' || options.cache === true) {
    options.cache = 'instance';
  }
  if (!options.cache) options.cache = 'shim';
  if (!options.context) options.context = this.impromptu;

  var Cache = this.factory.cache[options.cache] || this.factory.cache.instance;
  var cache = new Cache(this.impromptu, "" + this.name + ":" + key, options);
  return this._methods[key] = cache.run;
};


function ModuleFactory(impromptu) {
  this.impromptu = impromptu;
  this.cache = {
    instance: Impromptu.Cache.Instance,
    directory: Impromptu.Cache.Directory,
    repository: Impromptu.Cache.Repository,
    global: Impromptu.Cache.Global,
    shim: Impromptu.Cache.Shim
  };
}

ModuleFactory.prototype.register = function(name, fn) {
  return new Module(this.impromptu, this, name, fn)._methods;
};

ModuleFactory.prototype.require = function(module) {
  path = "" + this.impromptu.path.config + "/node_modules/" + module;
  var fn = require(path);
  if (typeof fn === 'function') {
    return this.register(path, fn);
  }
};


module.exports = ModuleFactory;
