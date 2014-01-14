Impromptu = require '../../lib/impromptu'
path = require 'path'

TEST_PROMPT_ROOT = path.resolve './test/prompts'

# Update the config path for the sample prompt file.
Impromptu.DEFAULT_CONFIG_DIR = "#{TEST_PROMPT_ROOT}/sample"

exports = module.exports =
  TEST_PROMPT_ROOT: TEST_PROMPT_ROOT

  isTravis: ->
    process.env.TRAVIS is 'true'
