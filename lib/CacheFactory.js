var InstanceCache = require('./cache/InstanceCache')
var ShimCache = require('./cache/ShimCache')

// Required for type checking.
var AbstractCache = require('./cache/AbstractCache')

/**
 * @constructor
 */
function CacheFactory(impromptu) {
  this.impromptu = impromptu

  /**
   * The registered cache providers.
   * @private {Object.<CacheFactory.Provider>}
   */
  this._providerMap = {}

  // Add default providers.
  this.addProvider('instance', function (name, options) {
    return new InstanceCache(impromptu, name, options)
  })

  this.addProvider('shim', function (name, options) {
    return new ShimCache(impromptu, name, options)
  })
}

/**
 * @typedef {function(string, Object): AbstractCache}
 */
CacheFactory.Provider; // jshint ignore:line

/**
 * Registers a provider to a corresponding cache type.
 * @param {string} cacheType
 * @param {CacheFactory.Provider} provider
 */
CacheFactory.prototype.addProvider = function (cacheType, provider) {
  this._providerMap[cacheType] = provider
}

/**
 * Creates a cache instance.
 * @param {string|boolean|undefined} cacheType
 * @param {string} name The name of the cache instance.
 * @param {Object} options The options passed to the cache instance.
 */
CacheFactory.prototype.create = function (cacheType, name, options) {
  // Cache responses using the instance cache by default.
  if (typeof cacheType === 'undefined' || cacheType === true) {
    cacheType = 'instance'
  }

  // If cache is specifically passed a falsy value, use a cache shim.
  // This won't cache the value, it just creates a consistent API.
  if (!cacheType) cacheType = 'shim'

  // Ensure the context is explicitly set. Makes the compiler happy.
  if (!options.context) options.context = null

  var provider = this._providerMap[cacheType]
  if (!provider) throw new Error('No provider registered for cache type "' + cacheType + '"')

  return provider(name, options)
}

module.exports = CacheFactory
