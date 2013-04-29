Impromptu = require '../../src/impromptu'

exports = module.exports =
  isTravis: ->
    process.env.TRAVIS is 'true'

  useTestDatabase: ->
    # Set the redis testing constants.
    Impromptu.DB.REDIS_PORT = 6421
    Impromptu.DB.REDIS_CONF_FILE = '../test/etc/redis.conf'
    Impromptu.DB.REDIS_PID_FILE = '/usr/local/var/run/redis-impromptu-test.pid'
