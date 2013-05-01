should = require 'should'
Impromptu = require '../src/impromptu'


describe 'Module', ->
  impromptu = new Impromptu
  methods = null
  counter = 0

  it 'should register a module', ->
    methods = impromptu.module.register 'module-tests', (Impromptu, register) ->
      register 'hello',
        update: ->
          'Hello, world!'

      register 'count',
        update: ->
          counter += 1

      register 'echo',
        update: (done) ->
          Impromptu.exec 'echo test', done

    methods.should.have.keys 'hello', 'count', 'echo'

  it 'should call a method', ->
    methods.hello (err, results) ->
      results.should.equal 'Hello, world!'

  it 'should cache a result', ->
    counter.should.equal 0

    methods.count (err, results) ->
      counter.should.equal 1
      results.should.equal 1

    methods.count (err, results) ->
      counter.should.equal 1
      results.should.equal 1

  it 'should execute a shell command', (done) ->
    methods.echo (err, results) ->
      results.should.equal 'test\n'
      done()
