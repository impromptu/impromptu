/**
 * A lightweight configuration manager.
 * @constructor
 */
function Config () {
  this._data = {}
}

/**
 * @param {string} key
 * @return {?}
 */
Config.prototype.get = function (key) {
  return this._data[key]
}

/**
 * @param {string} key
 * @param {?} value
 */
Config.prototype.set = function (key, value) {
  this._data[key] = value
}

module.exports = Config
