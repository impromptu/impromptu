should = require 'should'
Impromptu = require '../lib/impromptu.js'


describe 'Prompt', ->
  before (done) ->
    Impromptu.db.client().on 'connect', done

  it 'should be clear', (done) ->
    Impromptu.prompt.exists 'id1', 'field1', (err, exists) ->
      exists.should.equal 0
      done()

  it 'should set data', (done) ->
    Impromptu.prompt.set 'id1', 'field1', 'value1', ->
      Impromptu.prompt.get 'id1', 'field1', (err, value) ->
        value.should.equal 'value1'
        done()

  it 'should remove data', (done) ->
    Impromptu.prompt.del 'id1', 'field1', ->
      Impromptu.prompt.exists 'id1', 'field1', (err, exists) ->
        exists.should.equal 0
        done()

