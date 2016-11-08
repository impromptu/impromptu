var should = require('should')
var environment = require('./shared/environment')
var impromptu = require('../lib/impromptu')

describe('Module', function() {
  var methods = null
  var counter = 0
  it('should register a module', function() {
    methods = impromptu.module.register('module-tests', function(Impromptu, register) {
      register('hello', {
        update: function() {
          return 'Hello, world!'
        }
      })
      register('count', {
        update: function() {
          return counter += 1
        }
      })
      register('echo', {
        update: function(done) {
          return impromptu.exec('echo test', done)
        }
      })
    })
    methods.should.have.keys('hello', 'count', 'echo')
  })
  it('should call a method', function() {
    methods.hello(function(err, results) {
      results.should.equal('Hello, world!')
    })
  })
  it('should cache a result', function() {
    counter.should.equal(0)
    methods.count(function(err, results) {
      counter.should.equal(1)
      results.should.equal(1)
    })
    methods.count(function(err, results) {
      counter.should.equal(1)
      results.should.equal(1)
    })
  })
  it('should execute a shell command', function(done) {
    methods.echo(function(err, results) {
      results.should.equal('test\n')
      done()
    })
  })
})
