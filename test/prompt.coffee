should = require 'should'
Impromptu = require '../lib/impromptu.js'


describe 'Prompt', ->
  prompt = new Impromptu.Prompt 'id1'

  before (done) ->
    Impromptu.db.client().on 'connect', done

  it 'should be clear', (done) ->
    prompt.exists 'field1', (err, exists) ->
      exists.should.equal 0
      done()

  it 'should set data', (done) ->
    prompt.set 'field1', 'value1', ->
      prompt.get 'field1', (err, value) ->
        value.should.equal 'value1'
        done()

  it 'should remove data', (done) ->
    prompt.del 'field1', ->
      prompt.exists 'field1', (err, exists) ->
        exists.should.equal 0
        done()

