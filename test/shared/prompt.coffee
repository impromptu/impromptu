should = require 'should'
environment = require './environment'
Impromptu = require '../../lib/impromptu'
exec = require('child_process').exec
path = require 'path'

class PromptTests
  constructor: (@name) ->

  shouldInitializeImpromptu: ->
    @impromptu = new Impromptu
      config: "#{environment.TEST_PROMPT_ROOT}/#{@name}"

    should.exist @impromptu

  shouldLoadThePromptFile: ->
    @shouldInitializeImpromptu()
    @impromptu.load()
    @impromptu.prompt._orderedSections.length.should.be.ok

  shouldBuildPrompt: (fn) ->
    @shouldLoadThePromptFile()
    @impromptu.prompt.build (err, prompt) =>
      should.exist prompt
      fn err, prompt

  clean: (fn) ->
    @shouldInitializeImpromptu() unless @impromptu
    # Remove the `.compiled` directory and the debug log.
    compiledDir = path.dirname @impromptu.path.compiled
    exec "rm -rf #{compiledDir} #{@impromptu.path.log}", fn
    delete @impromptu

module.exports = (name) ->
  tests = new PromptTests name

  it 'should load the prompt file', ->
    tests.shouldLoadThePromptFile()

  it 'should build a prompt', (done) ->
    tests.shouldBuildPrompt done

  afterEach (done) ->
    tests.clean done

  tests
