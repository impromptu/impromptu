should = require 'should'
environment = require './shared/environment'
Impromptu = require '../lib/impromptu'
promptTests = require './shared/prompt'

describe 'Prompt Files', ->
  describe 'Sample', ->
    tests = promptTests 'sample',
      expectedPrompt: "\x1b[42m\x1b[37m user@host \x1b[0m\x1b[44m\x1b[37m ~/path/to/impromptu \x1b[0m"

  describe 'Compiler Error', ->
    tests = promptTests 'compiler-error',
      expectedError:
        name: 'compiler error'
        text: 'Your prompt file is not valid CoffeeScript.'

  describe 'JavaScript Loading Error', ->
    tests = promptTests 'load-error',
      expectedError:
        name: 'runtime error'
        text: 'Your prompt file triggered a JavaScript error.'
