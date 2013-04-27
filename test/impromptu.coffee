should = require 'should'
Impromptu = require '../src/impromptu'


describe 'Impromptu', ->
  it 'should exist', ->
    should.exist Impromptu

describe 'Impromptu.Error', ->
  it 'should have a message', ->
    error = new Impromptu.Error 'message'
    error.message.should.equal 'message'

  it 'should be throwable', ->
    (-> throw new Impromptu.Error('message')).should.throw 'message'

  it 'should support the `instanceof` keyword', ->
    error = new Impromptu.Error
    error.should.be.an.instanceof Impromptu.Error

  it 'should be extendable', ->
    class CustomError extends Impromptu.Error

    error = new CustomError
    error.should.be.an.instanceof Impromptu.Error
    error.should.be.an.instanceof CustomError

