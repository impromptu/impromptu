should = require 'should'
environment = require './shared/environment'
Impromptu = require '../lib/impromptu'
promptTests = require './shared/prompt'

describe 'Prompt Files', ->
  describe 'Sample', ->
    tests = promptTests 'sample'

    it 'should equal the expected prompt', (done) ->
      tests.shouldBuildPrompt (err, prompt) ->
        prompt.should.equal "\x1b[42m\x1b[37m user@host \x1b[0m\x1b[44m\x1b[37m ~/path/to/impromptu \x1b[0m"
        done err


  describe 'Compiler Error', ->
    tests = promptTests 'compiler-error'

    it 'should report a compiler error', (done) ->
      tests.shouldBuildPrompt (err, prompt) ->
        prompt.should.include "\x1b[41m\x1b[37m Your prompt file is not valid CoffeeScript. \x1b[0m"
        done err
