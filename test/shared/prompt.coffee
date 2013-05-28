should = require 'should'
environment = require './environment'
Impromptu = require '../../lib/impromptu'
exec = require('child_process').exec
path = require 'path'

class PromptTests
  constructor: (@name) ->
    config = "#{environment.TEST_PROMPT_ROOT}/#{@name}"

    @impromptu = new Impromptu
      config: config

    @expected = require "#{config}/expected"

  shouldLoadThePromptFile: ->
    @impromptu.load()
    @impromptu.prompt._orderedSections.length.should.be.ok

  shouldEqualTheExpectedPrompt: (fn) ->
    @impromptu.prompt.build (err, prompt) =>
      prompt.should.equal @expected.prompt
      fn err

  cleanPromptDir: (done) ->
    # Remove the `.compiled` directory and the debug log.
    compiledDir = path.dirname @impromptu.path.compiled
    exec "rm -rf #{compiledDir} #{@impromptu.path.log}", done

module.exports = (name) ->
  tests = new PromptTests name

  it 'should load the prompt file', ->
    tests.shouldLoadThePromptFile()

  if tests.expected.prompt
    it 'should equal the expected prompt', (done) ->
      tests.shouldEqualTheExpectedPrompt done

  after (done) ->
    tests.cleanPromptDir done

  tests
