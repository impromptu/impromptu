should = require 'should'
environment = require './shared/environment'
Impromptu = require '../lib/impromptu'


describe 'Config File', ->
  impromptu = new Impromptu

  after (done) ->
    environment.cleanPromptDir impromptu, done

  tu = null

  it 'should create an instance of Impromptu', ->
    tu = new Impromptu()
    should.exist tu

  it 'should load the config file', ->
    impromptu.load()
    impromptu.prompt._orderedSections.length.should.be.ok

  it 'should build the prompt', (done) ->
    impromptu.prompt.build (err, prompt) ->
      prompt.should.equal '\x1b[42m\x1b[37m user@host \x1b[0m\x1b[44m\x1b[37m ~/path/to/impromptu \x1b[0m'
      done()