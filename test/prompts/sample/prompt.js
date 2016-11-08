module.exports = function(Impromptu, section) {
  var impromptu = this
  var methods = impromptu.plugin.create(function(sample) {
    sample.register('cwd', {
      update: function(done) {
        impromptu.exec('printf "~/path/to/impromptu"', done)
      }
    })
    sample.register('user', {
      update: function(done) {
        impromptu.exec('printf "user"', done)
      }
    })
    sample.register('host', {
      update: function(done) {
        impromptu.exec('printf "host"', done)
      }
    })
  })

  section('user', {
    content: [methods.user, methods.host],
    format: function(user, host) {
      return user + '@' + host
    },
    background: 'green',
    foreground: 'white'
  })

  section('cwd', {
    content: methods.cwd,
    background: 'blue',
    foreground: 'white'
  })
}
