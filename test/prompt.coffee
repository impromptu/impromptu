should = require 'should'
Impromptu = require '../src/impromptu'


describe 'Prompt', ->
  impromptu = new Impromptu

  helloSync = ->
    'Hello, world!'

  # Note: All module methods are handled asynchronously.
  methods = impromptu.module.register ->
    @register 'hello', helloSync

    @register 'echo', (done) ->
      @exec "printf test", done

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
    d:
      content: 'd'
      background: 'red'
      foreground: 'white'
    empty:
      content: ''
      background: 'red'
      foreground: 'white'
    hello:
      content: helloSync
      background: 'blue'
      foreground: 'white'
    echo:
      content: methods.echo
      background: 'blue'
      foreground: 'white'
    multi:
      content: [helloSync, ' | ', methods.echo, ' | ', methods.hello]
      background: 'blue'
      foreground: 'white'
    format:
      content: [helloSync, methods.echo, methods.hello]
      format: ->
        Array::slice.call(arguments).join ' | '
      background: 'blue'
      foreground: 'white'

  expect =
    a: '\x1B[44m\x1B[37m a \x1B[0m'
    b: '\x1B[42m\x1B[37m b \x1B[0m'
    c: '\x1B[41m\x1B[39m c \x1B[0m'
    hello: '\x1B[44m\x1B[37m Hello, world! \x1B[0m'
    echo: '\x1B[44m\x1B[37m test \x1B[0m'
    multi: '\x1B[44m\x1B[37m Hello, world! | test | Hello, world! \x1B[0m'

  makePrompt = (keys) ->
    prompt = new Impromptu.Prompt
    for key in keys
      prompt.section key, sections[key]
    prompt

  it 'should add sections', ->
    prompt = makePrompt ['a', 'b', 'c']
    prompt._orderedSections.length.should.equal 3

  it 'should assemble a prompt', (done) ->
    prompt = makePrompt ['a', 'b', 'c']
    prompt.build (err, result) ->
      result.should.equal "#{expect.a}#{expect.b}#{expect.c}"
      done()

  it 'should ignore empty sections', (done) ->
    prompt = makePrompt ['a', 'empty', 'c']
    prompt.build (err, result) ->
      result.should.equal "#{expect.a}#{expect.c}"
      done()

  it 'should join sections with the same background with one space', (done) ->
    prompt = makePrompt ['a', 'c', 'd']
    prompt.build (err, result) ->
      d = '\x1B[41m\x1B[37md \x1B[0m'
      result.should.equal "#{expect.a}#{expect.c}#{d}"
      done()

  it 'should handle synchronous content functions', (done) ->
    prompt = makePrompt ['b', 'hello', 'c']
    prompt.build (err, result) ->
      result.should.equal "#{expect.b}#{expect.hello}#{expect.c}"
      done()

  it 'should handle asynchronous content functions', (done) ->
    prompt = makePrompt ['b', 'echo', 'c']
    prompt.build (err, result) ->
      result.should.equal "#{expect.b}#{expect.echo}#{expect.c}"
      done()

  it 'should handle multiple content inputs', (done) ->
    prompt = makePrompt ['b', 'multi', 'c']
    prompt.build (err, result) ->
      result.should.equal "#{expect.b}#{expect.multi}#{expect.c}"
      done()

  it 'should handle formatted outputs', (done) ->
    prompt = makePrompt ['format']
    prompt.build (err, result) ->
      result.should.equal expect.multi
      done()
