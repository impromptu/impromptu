var should = require('should')
var environment = require('./shared/environment')
var Impromptu = require('../lib/impromptu').constructor
var util = require('util')

describe('Impromptu', function() {
  it('should exist', function() {
    should.exist(Impromptu)
  })
  it('should use semantic versions', function() {
    var regex = /^((\d+)\.(\d+)\.(\d+))(?:-([\dA-Za-z\-]+(?:\.[\dA-Za-z\-]+)*))?(?:\+([\dA-Za-z\-]+(?:\.[\dA-Za-z\-]+)*))?$/
    regex.test(Impromptu.VERSION).should.be["true"]
  })
})

describe('Impromptu.Error', function() {
  it('should have a message', function() {
    var error = new Impromptu.Error('message')
    error.message.should.equal('message')
  })
  it('should be throwable', function() {
    (function() {
      throw new Impromptu.Error('message')
    }).should["throw"]('message')
  })
  it('should support the `instanceof` keyword', function() {
    var error
    var error = new Impromptu.Error
    error.should.be.an["instanceof"](Impromptu.Error)
  })
  it('should be extendable', function() {
    var CustomError = function (message) {
      this.message = message
      Impromptu.Error.apply(this, arguments)
    }
    util.inherits(CustomError, Impromptu.Error)

    var error = new CustomError
    error.should.be.an["instanceof"](Impromptu.Error)
    error.should.be.an["instanceof"](CustomError)
  })
})
