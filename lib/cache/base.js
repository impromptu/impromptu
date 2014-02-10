var AbstractError = require('../error').Abstract

/**
 * An abstract class that manages how a method is cached.
 */
function Cache(impromptu, name, options) {
  this.impromptu = impromptu
  this.name = name
  this.options = options
  this._setThenGet = this._setThenGet.bind(this)
  this._update = this._update.bind(this)


  // Build our own `run` instance-method to accurately reflect the fact that
  // `run` is always asynchronous and requires an argument to declare itself
  // as such to our API.
  var protoRun = this.run
  this.run = function(done) {
    if (this.options.run) {
      return this.options.run.apply(this, arguments)
    } else {
      return protoRun.apply(this, arguments)
    }
  }.bind(this)
}

/**
 * The main method: `run` acts as a deterministic way to fetch and potentially
 * update the cache.
 *
 * Accepts a `fn` with a signature of `err, results`, where `results` is the
 * cached value.
 *
 * This method is bound to the instance so the method can be passed around
 * without the instance. Can be overloaded using `options.run`.
 */
Cache.prototype.run = function(fn) {
  throw AbstractError
}

/**
 * Gets the cached value.
 *
 * Accepts a `fn` with a signature of `err, results`, where `results` is the
 * cached value. Does not update the cache.
 */
Cache.prototype.get = function(fn) {
  throw AbstractError
}

/**
 * Updates the cached value.
 *
 * Accepts a `fn` with a signature of `err, success`, where `success` is a
 * boolean indicating whether the cached value was updated.
 */
Cache.prototype.set = function(fn) {
  throw AbstractError
}

/**
 * Clears the cached value.
 *
 * Accepts a `fn` with a signature of `err, success`, where `success` is a
 * boolean indicating whether the value was removed from the cache.
 */
Cache.prototype.unset = function(fn) {
  throw AbstractError
}

/**
 * Private. A low-level method to properly call the cache's update method.
 */
Cache.prototype._update = function(done) {
  done = done || (function(err, results) {})

  // If the method accepts an argument, it is asynchronous.
  if (this.options.update.length) {
    this.options.update.call(this.options.context, done)
    return
  }

  var results = null
  var err = null
  try {
    results = this.options.update.call(this.options.context)
  } catch (e) {
    err = e
  } finally {
    // Process the results if method is synchronous.
    done(err, results)
  }
}

/**
 * Private. A helper method to update the cached value, then fetch the cached value.
 */
Cache.prototype._setThenGet = function(done) {
  this.set(function(err, results) {
    if (err) {
      if (done) {
        done(err)
      }
    } else {
      this.get(done)
    }
  }.bind(this))
}

module.exports = Cache
