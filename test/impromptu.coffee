should = require 'should'
environment = require './shared/environment'
Impromptu = require('../lib/impromptu').constructor


describe 'Impromptu', ->
  it 'should exist', ->
    should.exist Impromptu

  it 'should use semantic versions', ->
    # https://github.com/coolaj86/semver-utils/blob/v1.0.1/semver-utils.js
    regex = /^((\d+)\.(\d+)\.(\d+))(?:-([\dA-Za-z\-]+(?:\.[\dA-Za-z\-]+)*))?(?:\+([\dA-Za-z\-]+(?:\.[\dA-Za-z\-]+)*))?$/
    regex.test(Impromptu.VERSION).should.be.true

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

