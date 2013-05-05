should = require 'should'
Impromptu = require '../src/impromptu'


describe 'Repository', ->
  impromptu = new Impromptu

  it 'should create the repository factory', ->
    should.exist impromptu.repository

  describe 'Fallback Repository', ->
    it 'should exist', ->
      should.exist impromptu.repository.fallback

    it 'should be active', (done) ->
      impromptu.repository.fallback.exists (err, exists) ->
        exists.should.be.ok
        done()

    it 'should return a root', (done) ->
      impromptu.repository.fallback.root (err, root) ->
        root.should.equal process.env.PWD
        done()

  describe 'Primary Repository', ->
    it 'should equal the fallback', (done) ->
      impromptu.repository.primary (err, repository) ->
        repository.should.equal impromptu.repository.fallback
        done()

    it 'should return the fallback root', (done) ->
      impromptu.repository.root (err, root) ->
        root.should.equal process.env.PWD
        done()
