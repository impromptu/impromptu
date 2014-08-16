var AbstractCache = require('./AbstractCache')
var util = require('util')
var async = require('async')
var exec = require('child_process').exec

var processIsRunning = function(pid) {
  try {
    // Attempt to ping the process.
    process.kill(pid, 0)
  } catch (ersch) {
    // If pinging the server throws an error (ESRCH), then the process isn't running.
    return false
  }

  return true
}

/**
 * @constructor
 * @extends {AbstractCache}
 * @param {*} impromptu
 * @param {string} name The name of the cache key.
 * @param {Object} options The options for this instance of the cache.
 */
function GlobalCache(impromptu, name, options) {
  AbstractCache.call(this, impromptu, name, options)
}
util.inherits(GlobalCache, AbstractCache)

GlobalCache.prototype.client = function() {
  return this.impromptu.db
}

GlobalCache.prototype.run = function(fn) {
  if (this._needsRefresh) {
    this._setThenGet(fn)
  } else {
    this.get(fn)
  }
}

GlobalCache.prototype.unset = function(fn) {
  this.client().del(this.name, "lock:" + this.name, "lock-process:" + this.name, function(err, results) {
    if (fn) {
      return fn(err, !!results)
    }
  })
}

GlobalCache.prototype.get = function(fn) {
  var fallback = this.options.fallback
  return this.client().get(this.name, function(err, results) {
    if (results == null) {
      results = fallback
    }

    if (fn) {
      fn(err, results)
    }
  })
}

GlobalCache.prototype.set = function(fn) {
  var client = this.client()
  var name = this.name
  var options = this.options
  var update = this._update

  if (!this._claimSetLock(fn)) return

  // Try to update the cached value.
  async.waterfall([
    // Check if the cached value is locked (and therefore still valid).
    function(done) {
      client.exists("lock:" + name, done)
    },

    // Check if there's a process already running to update the cache.
    function(exists, done) {
      if (exists) {
        done(new AbstractCache.Error('The cache is currently locked.'))
      } else {
        client.get("lock-process:" + name, done)
      }
    },

    function(pid, done) {
      if (pid && processIsRunning(pid)) {
        // There's already an update process running.
        done(new AbstractCache.Error('A process is currently updating the cache.'))

      } else {
        // Time to update the cache.
        // Set the process lock.
        client.set("lock-process:" + name, process.pid, done)
      }
    },

    function(locked, done) {
      // Run the provided method to generate the new value to cache.
      update.call(null, function(err, value) {
        if (err) {
          done(err)
          return
        }

        // Update the cache with the new value and locks.
        async.parallel([
          function(fin) {
            // Update the cached value.
            client.set(name, value, fin)
          },

          function(fin) {
            // If the cached value should be stored for a certain amount of
            // time, set the lock and expiration timer.
            if (options.expire) {
              client.set("lock:" + name, true, options.expire, fin)
            } else {
              fin()
            }
          }
        ], function(err) {
          if (err) {
            done(err)
            return
          }

          // Unset the lock process. The value has been updated.
          client.del("lock-process:" + name, done)
        })
      })
    }
  ], function(err, results) {
    // The update was successful if there was no error.
    var success = !!(results && !err)
    this._releaseSetLock(err, success)
  }.bind(this))
}

module.exports = GlobalCache
