Impromptu = require '../lib/impromptu'
impromptu = new Impromptu()

process.on 'message', (message) ->
  if message.type is 'options'
    options =
      env: {}

    if message.data
      for line in message.data.split '__IMPROMPTU__'
        continue unless line
        index = line.indexOf '='
        key = line.substr 0, index
        value = line.substr index + 1
        options.env[key] = value

    if options.env.IMPROMPTU_SHELL
      impromptu.options.prompt = options.env.IMPROMPTU_SHELL

    impromptu.load()
    impromptu.prompt.build (err, results) ->
      process.send
        type: 'prompt'
        data: results || ''
