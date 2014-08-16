var BaseError = require('../error')
var util = require('util')

var AbstractError = BaseError.Abstract

/**
 * An abstract class that manages how a method is cached.
 * @constructor
 * @param {*} impromptu
 * @param {string} name The name of the cache key.
 * @param {Object} options The options for this instance of the cache.
 */
function AbstractCache(impromptu, name, options) {
  this.impromptu = impromptu
  this.name = name
  this.options = options
  this._update = this._update.bind(this)

  this._setLock = false
  this._setCallbacks = []

  this._needsRefresh = false
  this.impromptu.state.on('refreshCache', function (needsRefresh) {
    this._needsRefresh = needsRefresh
  }.bind(this))


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
 * @constructor
 * @extends {BaseError}
 * @param {string=} message
 */
AbstractCache.Error = function (message) {
  BaseError.apply(this, arguments)
}
util.inherits(AbstractCache.Error, BaseError)

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
AbstractCache.prototype.run = function(fn) {
  throw AbstractError
}

/**
 * Gets the cached value.
 *
 * Accepts a `fn` with a signature of `err, results`, where `results` is the
 * cached value. Does not update the cache.
 */
AbstractCache.prototype.get = function(fn) {
  throw AbstractError
}

/**
 * Updates the cached value.
 *
 * Accepts a `fn` with a signature of `err, success`, where `success` is a
 * boolean indicating whether the cached value was updated.
 */
AbstractCache.prototype.set = function(fn) {
  throw AbstractError
}

/**
 * Clears the cached value.
 *
 * Accepts a `fn` with a signature of `err, success`, where `success` is a
 * boolean indicating whether the value was removed from the cache.
 */
AbstractCache.prototype.unset = function(fn) {
  throw AbstractError
}

/**
 * Private. A low-level method to properly call the cache's update method.
 */
AbstractCache.prototype._update = function(done) {
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
AbstractCache.prototype._setThenGet = function(done) {
  this.set(function(err, results) {
    if (err && !(err instanceof AbstractCache.Error)) {
      if (done) {
        done(err)
      }
    } else {
      this.get(done)
    }
  }.bind(this))
}

/**
 * Private. A helper method to ensure only one method updates the cache at a time.
 * @param {Function=} callback
 */
AbstractCache.prototype._claimSetLock = function(callback) {
  if (callback) this._setCallbacks.push(callback)
  if (this._setLock) {
    return false
  } else {
    this._setLock = true
    return true
  }
}

/**
 * Private. A helper method to release the lock for updating the cache value.
 */
AbstractCache.prototype._releaseSetLock = function(err, success) {
  // Copy the callbacks array to prevent race conditions where callbacks mutate the array.
  var callbacks = this._setCallbacks.slice()
  this._setCallbacks.length = 0

  this._setLock = false
  this._needsRefresh = false

  callbacks.forEach(function (callback) {
    callback(err, success)
  })
}

module.exports = AbstractCache
