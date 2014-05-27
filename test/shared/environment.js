var Impromptu = require('../../lib/impromptu').constructor
var path = require('path')
var TEST_PROMPT_ROOT = path.resolve('./test/prompts')

Impromptu.DEFAULT_CONFIG_DIR = TEST_PROMPT_ROOT + '/sample'

module.exports = {
  TEST_PROMPT_ROOT: TEST_PROMPT_ROOT,
  isTravis: function() {
    return process.env.TRAVIS === 'true'
  }
}
