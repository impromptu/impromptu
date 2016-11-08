var should = require('should')
var environment = require('./shared/environment')
var impromptu = require('../lib/impromptu')
var Impromptu = impromptu.constructor

describe('Prompt', function() {
  var helloSync = function() {
    return 'Hello, world!'
  }

  var methods = impromptu.module.register('prompt-tests', function(Impromptu, register) {
    register('hello', {
      update: helloSync
    })
    register('echo', {
      update: function(done) {
        return impromptu.exec("printf test", done)
      }
    })
  })

  var sections = {
    a: {
      content: 'a',
      background: 'blue',
      foreground: 'white'
    },
    b: {
      content: 'b',
      background: 'green',
      foreground: 'white'
    },
    c: {
      content: 'c',
      background: 'red',
      foreground: 'default'
    },
    d: {
      content: 'd',
      background: 'red',
      foreground: 'white'
    },
    empty: {
      content: '',
      background: 'red',
      foreground: 'white'
    },
    hello: {
      content: helloSync,
      background: 'blue',
      foreground: 'white'
    },
    echo: {
      content: methods.echo,
      background: 'blue',
      foreground: 'white'
    },
    multi: {
      content: [helloSync, ' | ', methods.echo, ' | ', methods.hello],
      background: 'blue',
      foreground: 'white'
    },
    format: {
      content: [helloSync, methods.echo, methods.hello],
      format: function() {
        return Array.prototype.slice.call(arguments).join(' | ')
      },
      background: 'blue',
      foreground: 'white'
    }
  }

  var expect = {
    a: '\x1B[44m\x1B[37m a \x1B[0m',
    b: '\x1B[42m\x1B[37m b \x1B[0m',
    c: '\x1B[41m\x1B[39m c \x1B[0m',
    hello: '\x1B[44m\x1B[37m Hello, world! \x1B[0m',
    echo: '\x1B[44m\x1B[37m test \x1B[0m',
    multi: '\x1B[44m\x1B[37m Hello, world! | test | Hello, world! \x1B[0m'
  }

  var makePrompt = function(keys) {
    var prompt = new Impromptu.Prompt(impromptu.color)
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i]
      prompt.section(key, sections[key])
    }
    return prompt
  }

  it('should add sections', function() {
    var prompt = makePrompt(['a', 'b', 'c'])
    prompt._orderedSections.length.should.equal(3)
  })
  it('should assemble a prompt', function(done) {
    var prompt = makePrompt(['a', 'b', 'c'])
    return prompt.build(function(err, result) {
      result.should.equal(expect.a + expect.b + expect.c)
      done()
    })
  })
  it('should ignore empty sections', function(done) {
    var prompt = makePrompt(['a', 'empty', 'c'])
    prompt.build(function(err, result) {
      result.should.equal(expect.a + expect.c)
      done()
    })
  })
  it('should join sections with the same background with one space', function(done) {
    var prompt = makePrompt(['a', 'c', 'd'])
    prompt.build(function(err, result) {
      var d = '\x1B[41m\x1B[37md \x1B[0m'
      result.should.equal(expect.a + expect.c + d)
      done()
    })
  })
  it('should handle synchronous content functions', function(done) {
    var prompt = makePrompt(['b', 'hello', 'c'])
    prompt.build(function(err, result) {
      result.should.equal("" + expect.b + expect.hello + expect.c)
      done()
    })
  })
  it('should handle asynchronous content functions', function(done) {
    var prompt = makePrompt(['b', 'echo', 'c'])
    prompt.build(function(err, result) {
      result.should.equal("" + expect.b + expect.echo + expect.c)
      done()
    })
  })
  it('should handle multiple content inputs', function(done) {
    var prompt = makePrompt(['b', 'multi', 'c'])
    prompt.build(function(err, result) {
      result.should.equal("" + expect.b + expect.multi + expect.c)
      done()
    })
  })
  it('should handle formatted outputs', function(done) {
    var prompt = makePrompt(['format'])
    prompt.build(function(err, result) {
      result.should.equal(expect.multi)
      done()
    })
  })
})
