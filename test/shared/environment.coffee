Impromptu = require '../../lib/impromptu'
path = require 'path'

# Update the config path for the sample prompt file.
Impromptu.CONFIG_DIR = path.resolve('./test/prompts/sample/')

# Set the redis testing constants.
Impromptu.DB.REDIS_PORT = 6421
Impromptu.DB.REDIS_CONF_FILE = '../test/etc/redis.conf'
Impromptu.DB.REDIS_PID_FILE = '/usr/local/var/run/redis-impromptu-test.pid'

exports = module.exports =
  isTravis: ->
    process.env.TRAVIS is 'true'
