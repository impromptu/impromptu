should = require 'should'
Impromptu = require '../lib/impromptu.js'


describe 'Color', ->
  it 'should format the foreground', () ->
    result = Impromptu.color 'test',
      foreground: 'red'

    result.should.equal '\x1B[31mtest\x1B[0m'


  it 'should format the background', () ->
    result = Impromptu.color 'test',
      background: 'red'

    result.should.equal '\x1B[41mtest\x1B[0m'


  it 'should format multiple attributes', () ->
    result = Impromptu.color 'test',
      foreground: 'white'
      background: 'blue'

    result.should.equal '\x1B[44m\x1B[37mtest\x1B[0m'


  it 'should reject unknown values', () ->
    result = Impromptu.color 'test',
      foreground: 'hello'
      background: 'world'

    result.should.equal 'test'

  it 'should only use its own keys', () ->
    result = Impromptu.color 'test',
      foreground: 'constructor'

    result.should.equal 'test'
