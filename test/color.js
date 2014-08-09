var should = require('should')
var environment = require('./shared/environment')
var Impromptu = require('../lib/impromptu').constructor

describe('Color', function() {
  var impromptu = new Impromptu
  it('should format the foreground', function() {
    var result = impromptu.color.format('test', {
      foreground: 'red'
    })
    result.should.equal('\x1B[31mtest\x1B[0m')
  })
  it('should format the background', function() {
    var result = impromptu.color.format('test', {
      background: 'red'
    })
    result.should.equal('\x1B[41mtest\x1B[0m')
  })
  it('should format multiple attributes', function() {
    var result = impromptu.color.format('test', {
      foreground: 'white',
      background: 'blue'
    })
    result.should.equal('\x1B[44m\x1B[37mtest\x1B[0m')
  })
  it('should reject unknown values', function() {
    var result = impromptu.color.format('test', {
      foreground: 'hello',
      background: 'world'
    })
    result.should.equal('test')
  })
  it('should only use its own keys', function() {
    var result = impromptu.color.format('test', {
      foreground: 'constructor'
    })
    result.should.equal('test')
  })
  describe('For Bash Prompt', function() {
    var impromptuBash = new Impromptu()
    impromptuBash.state.set('shell', 'bash')
    it('should format the foreground', function() {
      var result = impromptuBash.color.format('test', {
        foreground: 'red'
      })
      result.should.equal('\\[\\033[31m\\]test\\[\\033[0m\\]')
    })
    it('should format the background', function() {
      var result = impromptuBash.color.format('test', {
        background: 'red'
      })
      result.should.equal('\\[\\033[41m\\]test\\[\\033[0m\\]')
    })
    it('should format multiple attributes', function() {
      var result = impromptuBash.color.format('test', {
        foreground: 'white',
        background: 'blue'
      })
      result.should.equal('\\[\\033[44m\\]\\[\\033[37m\\]test\\[\\033[0m\\]')
    })
  })
  describe('For Zsh Prompt', function() {
    var impromptuZsh = new Impromptu()
    impromptuZsh.state.set('shell', 'zsh')
    it('should format the foreground', function() {
      var result
      result = impromptuZsh.color.format('test', {
        foreground: 'red'
      })
      result.should.equal('%{\x1B[31m%}test%{\x1B[0m%}')
    })
    it('should format the background', function() {
      var result = impromptuZsh.color.format('test', {
        background: 'red'
      })
      result.should.equal('%{\x1B[41m%}test%{\x1B[0m%}')
    })
    it('should format multiple attributes', function() {
      var result = impromptuZsh.color.format('test', {
        foreground: 'white',
        background: 'blue'
      })
      result.should.equal('%{\x1B[44m%}%{\x1B[37m%}test%{\x1B[0m%}')
    })
  })
})
