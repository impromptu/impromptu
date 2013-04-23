module.exports = (Impromptu, section) ->
  methods = Impromptu.module.register ->
    @register 'cwd', (done) ->
      @exec 'printf "~/path/to/impromptu"', done

    @register 'user', (done) ->
      @exec 'printf "user"', done

    @register 'host', (done) ->
      @exec 'printf "host"', done


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
