var util = require('util')

/**
 * @constructor
 * @extends {Error}
 * @param {string=} message
 */
var BaseError = function (message) {
  this.message = message || ''
  Error.apply(this, arguments)
}
util.inherits(BaseError, Error)


/**
 * @constructor
 * @extends {BaseError}
 * @param {string=} message
 */
var AbstractError = function (message) {
  message = message || 'This method should be defined in a subclass.'
  BaseError.call(this, message)
}
util.inherits(AbstractError, BaseError)

BaseError.Abstract = AbstractError
module.exports = BaseError
