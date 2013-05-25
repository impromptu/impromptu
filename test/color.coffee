should = require 'should'
environment = require './shared/environment'
Impromptu = require '../lib/impromptu'


describe 'Color', ->
  impromptu = new Impromptu

  it 'should format the foreground', ->
    result = impromptu.color.format 'test',
      foreground: 'red'

    result.should.equal '\x1B[31mtest\x1B[0m'


  it 'should format the background', ->
    result = impromptu.color.format 'test',
      background: 'red'

    result.should.equal '\x1B[41mtest\x1B[0m'


  it 'should format multiple attributes', ->
    result = impromptu.color.format 'test',
      foreground: 'white'
      background: 'blue'

    result.should.equal '\x1B[44m\x1B[37mtest\x1B[0m'


  it 'should reject unknown values', ->
    result = impromptu.color.format 'test',
      foreground: 'hello'
      background: 'world'

    result.should.equal 'test'

  it 'should only use its own keys', ->
    result = impromptu.color.format 'test',
      foreground: 'constructor'

    result.should.equal 'test'


  describe 'For Bash Prompt', ->
    impromptuBash = new Impromptu
      shell: 'bash'

    it 'should format the foreground', ->
      result = impromptuBash.color.format 'test',
        foreground: 'red'

      result.should.equal '\\[\\033[31m\\]test\\[\\033[0m\\]'


    it 'should format the background', ->
      result = impromptuBash.color.format 'test',
        background: 'red'

      result.should.equal '\\[\\033[41m\\]test\\[\\033[0m\\]'

    it 'should format multiple attributes', ->
      result = impromptuBash.color.format 'test',
        foreground: 'white'
        background: 'blue'

      result.should.equal '\\[\\033[44m\\]\\[\\033[37m\\]test\\[\\033[0m\\]'


  describe 'For Zsh Prompt', ->
    impromptuZsh = new Impromptu
      shell: 'zsh'

    it 'should format the foreground', ->
      result = impromptuZsh.color.format 'test',
        foreground: 'red'

      result.should.equal '%{\x1B[31m%}test%{\x1B[0m%}'


    it 'should format the background', ->
      result = impromptuZsh.color.format 'test',
        background: 'red'

      result.should.equal '%{\x1B[41m%}test%{\x1B[0m%}'

    it 'should format multiple attributes', ->
      result = impromptuZsh.color.format 'test',
        foreground: 'white'
        background: 'blue'

      result.should.equal '%{\x1B[44m%}%{\x1B[37m%}test%{\x1B[0m%}'
