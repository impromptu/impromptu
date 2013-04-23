should = require 'should'
Impromptu = require '../lib/impromptu.js'
async = require 'async'
_ = require 'underscore'


describe 'Prompt', ->
  sections =
    a:
      content: 'a'
      background: 'blue'
      foreground: 'white'
    b:
      content: 'b'
      background: 'green'
      foreground: 'white'
    c:
      content: 'c'
      background: 'red'
      foreground: 'default'

  makePrompt = (keys) ->
    prompt = new Impromptu.Prompt
    for key in keys
      prompt.section key, sections[key]
    prompt

  before (done) ->
    Impromptu.db.client().on 'connect', done

  it 'should add sections', ->
    prompt = makePrompt ['a', 'b', 'c']
    prompt._orderedSections.length.should.equal 3

  it 'should assemble a prompt', (done) ->
    prompt = makePrompt ['a', 'b', 'c']
    prompt.build (err, result) ->
      a = '\x1B[44m\x1B[37m a \x1B[0m'
      b = '\x1B[42m\x1B[37m b \x1B[0m'
      c = '\x1B[41m\x1B[39m c \x1B[0m'
      result.should.equal "#{a}#{b}#{c}"
      done()

