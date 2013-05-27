should = require 'should'
environment = require './shared/environment'
Impromptu = require '../lib/impromptu'
path = require 'path'
exec = require('child_process').exec


describe 'Config File', ->
  impromptu = new Impromptu

  after (done) ->
    tempDir = path.dirname impromptu.path.compiled
    exec "rm -rf #{tempDir}", ->
      done()

  tu = null

  it 'should create an instance of Impromptu', ->
    tu = new Impromptu()
    should.exist tu

  it 'should load the config file', ->
    impromptu.load()
    impromptu.prompt._orderedSections.length.should.be.ok

  it 'should build the prompt', (done) ->
    impromptu.prompt.build (err, prompt) ->
      prompt.should.equal '\u001b[42m\u001b[37m user@host \u001b[0m\u001b[44m\u001b[37m ~/path/to/impromptu \u001b[0m'
      done()