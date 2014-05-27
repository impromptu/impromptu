var should = require('should')
var environment = require('./shared/environment')
var Impromptu = require('../lib/impromptu').constructor

describe('Exec', function() {
  it('should execute a shell command', function(done) {
    Impromptu.exec('printf "Hello, world\!"', function(err, stdout, stderr) {
      stdout.should.equal('Hello, world!')
      done()
    })
  })
  it('should cache a result', function(done) {
    Impromptu.exec('printf $RANDOM', function(err, first) {
      Impromptu.exec('printf $RANDOM', function(err, second) {
        first.should.equal(second)
        done()
      })
    })
  })
})
