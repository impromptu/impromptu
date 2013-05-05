should = require 'should'
Impromptu = require '../lib/impromptu'


describe 'Exec', ->
  it 'should execute a shell command', (done) ->
    Impromptu.exec 'printf "Hello, world\!"', (err, stdout, stderr) ->
      stdout.should.equal "Hello, world!"
      done()

  it 'should cache a result', (done) ->
    Impromptu.exec 'printf $RANDOM', (err, first) ->
      Impromptu.exec 'printf $RANDOM', (err, second) ->
        first.should.equal second
        done()
