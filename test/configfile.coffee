should = require 'should'
Impromptu = require '../lib/impromptu.js'
path = require 'path'

Impromptu::paths = [path.resolve('./test/etc/sample-configfile.coffee')]

describe 'Config File', ->
  tu = null

  it 'should create an instance of Impromptu', ->
    tu = new Impromptu()
    should.exist tu

  it 'should load the config file', ->
    tu.prompt._orderedSections.length.should.be.ok

  it 'should build the prompt', (done) ->
    tu.prompt.build (err, prompt) ->
      prompt.should.equal '\u001b[42m\u001b[37m user@host \u001b[0m\u001b[44m\u001b[37m ~/path/to/impromptu \u001b[0m'
      done()