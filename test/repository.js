var should = require('should')
var environment = require('./shared/environment')
var Impromptu = require('../lib/impromptu').constructor

describe('Repository', function() {
  var impromptu = new Impromptu
  it('should create the repository factory', function() {
    should.exist(impromptu.repository)
  })
  describe('Fallback Repository', function() {
    it('should exist', function() {
      should.exist(impromptu.repository.fallback)
    })
    it('should be active', function(done) {
      impromptu.repository.fallback.exists(function(err, exists) {
        exists.should.be.ok
        done()
      })
    })
    it('should return a root', function(done) {
      impromptu.repository.fallback.root(function(err, root) {
        root.should.equal(process.env.PWD)
        done()
      })
    })
  })
  describe('Primary Repository', function() {
    it('should equal the fallback', function(done) {
      impromptu.repository.primary(function(err, repository) {
        repository.should.equal(impromptu.repository.fallback)
        done()
      })
    })
    it('should return the fallback root', function(done) {
      impromptu.repository.root(function(err, root) {
        root.should.equal(process.env.PWD)
        done()
      })
    })
  })
})
