should = require 'should'
environment = require './shared/environment'
Impromptu = require '../lib/impromptu'
promptTests = require './shared/prompt'

describe 'Sample Prompt File', ->
  promptTests 'sample'
