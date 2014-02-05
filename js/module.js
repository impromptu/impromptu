(function() {
  var Impromptu, ModuleFactory, exec, exports, path, _Module,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  Impromptu = require('./impromptu');

  path = require('path');

  exec = require('child_process').exec;

  _Module = (function() {
    function _Module(impromptu, factory, name, initialize) {
      this.impromptu = impromptu;
      this.factory = factory;
      this.name = name;
      this.register = __bind(this.register, this);
      this._methods = {};
      initialize.call(this.impromptu, Impromptu, this.register, this._methods);
    }

    _Module.prototype.register = function(key, options) {
      var Cache, cache, _ref;

      if (typeof options.cache === 'undefined' || options.cache === true) {
        options.cache = 'instance';
      }
      options.cache || (options.cache = 'shim');
      if ((_ref = options.context) == null) {
        options.context = this.impromptu;
      }
      Cache = this.factory.cache[options.cache] || this.factory.cache.instance;
      cache = new Cache(this.impromptu, "" + this.name + ":" + key, options);
      return this._methods[key] = cache.run;
    };

    return _Module;

  })();

  ModuleFactory = (function() {
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
      return new _Module(this.impromptu, this, name, fn)._methods;
    };

    ModuleFactory.prototype.require = function(module) {
      var fn;

      path = "" + this.impromptu.path.config + "/node_modules/" + module;
      fn = require(path);
      if (typeof fn === 'function') {
        return this.register(path, fn);
      }
    };

    return ModuleFactory;

  })();

  exports = module.exports = ModuleFactory;

}).call(this);
