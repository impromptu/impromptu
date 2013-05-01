module.exports = (Impromptu, section) ->
  methods = @module.register 'sample-configfile', (Impromptu, register) ->
    register 'cwd',
      update: (done) ->
        Impromptu.exec 'printf "~/path/to/impromptu"', done

    register 'user',
      update: (done) ->
        Impromptu.exec 'printf "user"', done

    register 'host',
      update: (done) ->
        Impromptu.exec 'printf "host"', done


  section 'user',
    content: [methods.user, methods.host]
    format: (user, host) ->
      "#{user}@#{host}"
    background: 'green'
    foreground: 'white'

  section 'cwd',
    content: methods.cwd
    background: 'blue'
    foreground: 'white'
