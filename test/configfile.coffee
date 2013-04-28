should = require 'should'
Impromptu = require '../src/impromptu'
path = require 'path'

Impromptu::paths = [path.resolve('./test/etc/sample-configfile.coffee')]

describe 'Config File', ->
  impromptu = new Impromptu

  it 'should load the config file', ->
    impromptu.prompt._orderedSections.length.should.be.ok

  it 'should build the prompt', (done) ->
    impromptu.prompt.build (err, prompt) ->
      prompt.should.equal '\u001b[42m\u001b[37m user@host \u001b[0m\u001b[44m\u001b[37m ~/path/to/impromptu \u001b[0m'
      done()