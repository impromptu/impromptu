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


describe 'Section', ->
  section = new Impromptu.Section 'id1'

  ['content', 'background', 'foreground'].forEach (property) ->
    it "#{property} should be clear", (done) ->
      section[property] 'section', (err, result) ->
        should.not.exist result
        done()

    it "#{property} should set data", (done) ->
      section[property] 'section', "#{property}-value", (err) ->
        section[property] 'section', (err, result) ->
          result.should.equal "#{property}-value"
          done()

  it "should remove data", (done) ->
    section.del 'section', (err) ->
      section.content 'section', (err, result) ->
        should.not.exist result
        done()