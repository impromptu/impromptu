var util = require('util')

/**
 * @constructor
 * @extends {Error}
 */
var BaseError = function (message) {
  this.message = message
  Error.apply(this, arguments)
}
util.inherits(BaseError, Error)


/**
 * @constructor
 * @extends {BaseError}
 */
var AbstractError = function (message) {
  this.message = message
  if (!this.message) {
    this.message = 'This method should be defined in a subclass.'
  }
  BaseError.apply(this, arguments)
}
util.inherits(AbstractError, BaseError)

BaseError.Abstract = AbstractError
module.exports = BaseError
