var Impromptu = require('./impromptu');
var async = require('async');
var _ = require('underscore');


function Repository(impromptu) {
  this.impromptu = impromptu;
}

Repository.prototype.type = 'fallback';

Repository.prototype.root = function(fn) {
  return fn(null, process.env.PWD);
};

Repository.prototype.branch = function(fn) {
  return fn(null, '');
};

Repository.prototype.commit = function(fn) {
  return fn(null, '');
};

Repository.prototype.exists = function(fn) {
  return this.root(function(err, root) {
    return fn(err, !!root);
  });
};


function RepositoryFactory(impromptu) {
  this.impromptu = impromptu;
  this._repositories = [];
  this.register('fallback');
}

RepositoryFactory.prototype.register = function(type, options) {
  var repository;

  if (options == null) {
    options = {};
  }
  options.type = type;
  repository = new Repository(this.impromptu);
  _.extend(repository, options);
  this._repositories.unshift(repository);
  return this[type] = repository;
};

RepositoryFactory.prototype.primary = function(fn) {
  var exists,
    _this = this;

  if (this._primary) {
    return fn(null, this._primary);
  }
  if (this._callbacks) {
    this._callbacks.push(fn);
    return;
  }
  this._callbacks = [fn];
  exists = {};
  return async.each(this._repositories, function(repository, done) {
    return repository.exists(function(err, result) {
      var callback, _i, _j, _len, _len1, _ref, _ref1;

      exists[repository.type] = result;
      if (_this._primary) {
        return;
      }
      _ref = _this._repositories;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        repository = _ref[_i];
        if (typeof exists[repository.type] !== 'boolean') {
          break;
        }
        if (exists[repository.type]) {
          _this._primary = repository;
          _ref1 = _this._callbacks;
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            callback = _ref1[_j];
            callback(null, _this._primary);
          }
          delete _this._callbacks;
          return;
        }
      }
    });
  });
};

RepositoryFactory.prototype.root = function(fn) {
  return this.primary(function(err, repository) {
    if (err) {
      return fn(err);
    }
    return repository.root(fn);
  });
};

RepositoryFactory.prototype.branch = function(fn) {
  return this.primary(function(err, repository) {
    if (err) {
      return fn(err);
    }
    return repository.branch(fn);
  });
};

RepositoryFactory.prototype.commit = function(fn) {
  return this.primary(function(err, repository) {
    if (err) {
      return fn(err);
    }
    return repository.commit(fn);
  });
};

module.exports = RepositoryFactory;
