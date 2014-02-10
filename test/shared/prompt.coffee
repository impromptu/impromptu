should = require 'should'
environment = require './environment'
Impromptu = require('../../lib/impromptu').constructor
exec = require('child_process').exec
path = require 'path'
fs = require 'fs'

class PromptTests
  constructor: (@name) ->

  shouldInitializeImpromptu: ->
    @impromptu = new Impromptu
    @impromptu.config.set 'root', "#{environment.TEST_PROMPT_ROOT}/#{@name}"

    should.exist @impromptu

  shouldLoadThePromptFile: ->
    @shouldInitializeImpromptu()
    @impromptu.load()
    @impromptu.prompt._orderedSections.length.should.be.ok

  shouldBuildPrompt: (fn) ->
    @shouldLoadThePromptFile()
    @impromptu.build (err, prompt) =>
      should.exist prompt
      fn err, prompt

  shouldCreateDebugLog: (fn) ->
    @shouldBuildPrompt (err, prompt) =>
      exists = fs.existsSync @impromptu.path('log')
      exists.should.be.ok
      log = if exists then fs.readFileSync(@impromptu.path('log')).toString() else ''
      fn err, log

  shouldNotCreateDebugLog: (fn) ->
    @shouldBuildPrompt (err, prompt) =>
      exists = fs.existsSync(@impromptu.path('log'))
      exists.should.not.be.ok
      fn err

  clean: (fn) ->
    @shouldInitializeImpromptu() unless @impromptu
    # Remove the `.compiled` directory and the debug log.
    compiledDir = path.dirname @impromptu.path('compiled')
    logFilePath = @impromptu.path('log')
    exec "rm -rf #{compiledDir} #{logFilePath}", fn
    delete @impromptu

module.exports = (name, options = {}) ->
  tests = new PromptTests name

  afterEach (done) ->
    tests.clean done

  it 'should load the prompt file', ->
    tests.shouldLoadThePromptFile()

  it 'should build a prompt', (done) ->
    tests.shouldBuildPrompt done

  if options.expectedPrompt
    it 'should equal the expected prompt', (done) ->
      tests.shouldBuildPrompt (err, prompt) ->
        prompt.should.equal options.expectedPrompt
        done err

  if options.expectedError
    it "should report a #{options.expectedError.name}", (done) ->
      tests.shouldBuildPrompt (err, prompt) ->
        prompt.should.include options.expectedError.text
        done err

    it 'should create a debug log file', (done) ->
      tests.shouldCreateDebugLog done

    it "should log a #{options.expectedError.name}", (done) ->
      tests.shouldCreateDebugLog (err, log) ->
        log.should.include options.expectedError.text
        done err

  else
    it 'should not create a debug log file', (done) ->
      tests.shouldNotCreateDebugLog done

  tests
