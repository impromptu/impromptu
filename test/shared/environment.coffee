Impromptu = require '../../lib/impromptu'
path = require 'path'

# Update the test paths for the sample prompt file.
Impromptu::paths = [path.resolve('./test/etc/sample-configfile.coffee')]
Impromptu::compiledPrompt = path.resolve('./test/etc/.compiled/sample-configfile.js')

# Set the redis testing constants.
Impromptu.DB.REDIS_PORT = 6421
Impromptu.DB.REDIS_CONF_FILE = '../test/etc/redis.conf'
Impromptu.DB.REDIS_PID_FILE = '/usr/local/var/run/redis-impromptu-test.pid'

exports = module.exports =
  isTravis: ->
    process.env.TRAVIS is 'true'
