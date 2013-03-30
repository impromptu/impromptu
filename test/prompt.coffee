should = require 'should'
Impromptu = require '../lib/impromptu.js'
_ = require 'underscore'


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


describe 'Section', ->
  section = new Impromptu.Section 'id1'

  props =
    content: 'batch content'
    foreground: 'red'
    background: 'black'

  _.each props, (value, property) ->
    it "#{property} should be clear", (done) ->
      section[property] 'test-section', (err, result) ->
        should.not.exist result
        done()

    it "#{property} should set data", (done) ->
      section[property] 'test-section', value, (err) ->
        section[property] 'test-section', (err, result) ->
          result.should.equal value
          done()

  it "should remove data", (done) ->
    section.del 'test-section', (err) ->
      section.content 'test-section', (err, result) ->
        should.not.exist result
        done()

  it "should handle batched data", (done) ->
    section.set 'test-batch-section', props, (err) ->
      section.get 'test-batch-section', (err, result) ->
        result.should.eql props
        done()

  it "should remove batched data", (done) ->
    section.del 'test-batch-section', (err) ->
      section.get 'test-batch-section', (err, result) ->
        result.should.eql
          content: null
          foreground: null
          background: null
        done()
