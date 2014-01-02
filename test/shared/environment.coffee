Impromptu = require '../../lib/impromptu'
path = require 'path'

TEST_PROMPT_ROOT = path.resolve './test/prompts'

# Update the config path for the sample prompt file.
Impromptu.DEFAULT_CONFIG_DIR = "#{TEST_PROMPT_ROOT}/sample"

# Set the redis testing constants.
Impromptu.DB.REDIS_PORT = 6421
Impromptu.DB.REDIS_CONF_FILE = '../test/etc/redis.conf'
Impromptu.DB.REDIS_PID_FILE = '/usr/local/var/run/redis-impromptu-test.pid'

# Shut down the Redis server after all tests have completed.
after ->
  db = new Impromptu.DB
  db.shutdown()

exports = module.exports =
  TEST_PROMPT_ROOT: TEST_PROMPT_ROOT

  isTravis: ->
    process.env.TRAVIS is 'true'
