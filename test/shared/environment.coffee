Impromptu = require '../../lib/impromptu'
path = require 'path'
exec = require('child_process').exec

TEST_PROMPT_ROOT = path.resolve './test/prompts'

# Update the config path for the sample prompt file.
Impromptu.DEFAULT_CONFIG_DIR = "#{TEST_PROMPT_ROOT}/sample"

# Set the redis testing constants.
Impromptu.DB.REDIS_PORT = 6421
Impromptu.DB.REDIS_CONF_FILE = '../test/etc/redis.conf'
Impromptu.DB.REDIS_PID_FILE = '/usr/local/var/run/redis-impromptu-test.pid'

exports = module.exports =
  TEST_PROMPT_ROOT: TEST_PROMPT_ROOT

  isTravis: ->
    process.env.TRAVIS is 'true'

  cleanPromptDir: (impromptu, done) ->
    # Remove the `.compiled` directory and the debug log.
    compiledDir = path.dirname impromptu.path.compiled
    exec "rm -rf #{compiledDir} #{impromptu.path.log}", done
