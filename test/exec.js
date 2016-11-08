var should = require('should')
var environment = require('./shared/environment')
var impromptu = require('../lib/impromptu')

describe('Exec', function() {
  it('should execute a shell command', function(done) {
    impromptu.exec('printf "Hello, world\!"', function(err, stdout, stderr) {
      stdout.should.equal('Hello, world!')
      done()
    })
  })
  it('should cache a result', function(done) {
    impromptu.exec('printf $RANDOM', function(err, first) {
      impromptu.exec('printf $RANDOM', function(err, second) {
        first.should.equal(second)
        done()
      })
    })
  })
})
