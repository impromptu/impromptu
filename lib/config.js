var events = require('events')

/**
 * A lightweight configuration manager.
 * @constructor
 */
function Config () {
  /** @private {events.EventEmitter} */
  this._emitter = new events.EventEmitter()

  /** @private {Object.<string, ?>} */
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
  var previousValue = this.get(key)
  if (value === previousValue) return

  this._emitter.emit(key, value, previousValue)
  this._data[key] = value
}

/**
 * @param {string} event
 * @param {function(...)} listener
 */
Config.prototype.on = function (event, listener) {
  this._emitter.on(event, listener)
}

/**
 * @param {string} event
 * @param {function(...)} listener
 */
Config.prototype.off = function (event, listener) {
  this._emitter.removeListener(event, listener)
}

module.exports = Config
