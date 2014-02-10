var async = require('async')
var _ = require('underscore')

/**
 * Represents the current repository to Impromptu, so modules can act upon
 * repository data.
 */
function Repository(impromptu) {
  this.impromptu = impromptu
}

/**
 * The type of repository (e.g. git, svn).
 */
Repository.prototype.type = 'fallback'

/**
 * The path to the root of the repository.
 * Defaults to the current working directory.
 *
 * Receives a callback `fn`, which accepts an error `err` and a string `path`.
 */
Repository.prototype.root = function(fn) {
  return fn(null, process.env.PWD)
}

/**
 * The current branch of the repository, if the repository supports branches.
 *
 * Receives a callback `fn`, which accepts an error `err` and a string `branch`.
 */
Repository.prototype.branch = function(fn) {
  return fn(null, '')
}

/**
 * The current commit of the repository, if the repository supports commits.
 *
 * Receives a callback `fn`, which accepts an error `err` and a string `commit`.
 */
Repository.prototype.commit = function(fn) {
  return fn(null, '')
}

/**
 * Whether the repository exists.
 * Defaults to checking for the repository root.
 *
 * Receives a callback `fn`, which accepts an error `err` and a boolean `exists`.
 */
Repository.prototype.exists = function(fn) {
  return this.root(function(err, root) {
    return fn(err, !!root)
  })
}


function RepositoryFactory(impromptu) {
  this.impromptu = impromptu
  this._repositories = []
  this.register('fallback')
}

/**
 * Register a new repository.
 */
RepositoryFactory.prototype.register = function(type, options) {
  options = options || {}

  // Build the repository.
  options.type = type
  var repository = new Repository(this.impromptu)
  _.extend(repository, options)

  // Track the new repository.
  this._repositories.unshift(repository)

  // Expose the repository as a property of the factory.
  this[type] = repository
  return repository
}

RepositoryFactory.prototype.primary = function(fn) {
  if (this._primary) {
    fn(null, this._primary)
    return
  }

  // Prevent race conditions by tracking the queue of callbacks while we're
  // looking for the primary repository.
  if (this._callbacks) {
    this._callbacks.push(fn)
    return
  }
  this._callbacks = [fn]

  // Track whether each repository exists.
  var exists = {}

  async.each(this._repositories, function(repository, done) {
    repository.exists(function(err, result) {
      exists[repository.type] = result
      if (this._primary) {
        return
      }

      // Find the highest priority repository that exists.
      // This is the repository that was registered last.
      for (var i = 0; i < this._repositories.length; i++) {
        var potentialPrimary = this._repositories[i]

        // If we don't know whether this repository exists, bail.
        if (typeof exists[potentialPrimary.type] !== 'boolean') break

        // This repository exists, and all higher priority repositories do not.
        // We've found the primary repository.
        if (exists[potentialPrimary.type]) {
          this._primary = potentialPrimary

          for (var j = 0; j < this._callbacks.length; j++) {
            this._callbacks[j](null, this._primary)
          }

          // Clear all of the callbacks.
          this._callbacks.length = 0
        }
      }
    }.bind(this))
  }.bind(this))
}

/**
 * Finds the root of the primary repository.
 */
RepositoryFactory.prototype.root = function(fn) {
  return this.primary(function(err, repository) {
    if (err) {
      return fn(err)
    }
    return repository.root(fn)
  })
}

/**
 * Finds the branch of the primary repository.
 */
RepositoryFactory.prototype.branch = function(fn) {
  return this.primary(function(err, repository) {
    if (err) {
      return fn(err)
    }
    return repository.branch(fn)
  })
}

/**
 * Finds the commit of the primary repository.
 */
RepositoryFactory.prototype.commit = function(fn) {
  return this.primary(function(err, repository) {
    if (err) {
      return fn(err)
    }
    return repository.commit(fn)
  })
}

module.exports = RepositoryFactory
