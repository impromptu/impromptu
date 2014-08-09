var events = require('events')

/**
 * A lightweight configuration manager.
 * @constructor
 */
function State () {
  /** @private {events.EventEmitter} */
  this._emitter = new events.EventEmitter()
  this._emitter.setMaxListeners(200)

  /** @private {Object.<string, ?>} */
  this._data = {}
}

/**
 * @param {string} key
 * @return {?}
 */
State.prototype.get = function (key) {
  return this._data[key]
}

/**
 * @param {string} key
 * @param {?} value
 */
State.prototype.set = function (key, value) {
  var previousValue = this.get(key)
  if (value === previousValue) return

  this._emitter.emit(key, value, previousValue)
  this._data[key] = value
}

/**
 * @param {string} event
 * @param {function(...)} listener
 */
State.prototype.on = function (event, listener) {
  this._emitter.on(event, listener)
}

/**
 * @param {string} event
 * @param {function(...)} listener
 */
State.prototype.off = function (event, listener) {
  this._emitter.removeListener(event, listener)
}

module.exports = State
