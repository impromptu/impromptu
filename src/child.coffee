Impromptu = require '../lib/impromptu'
impromptu = new Impromptu()

process.on 'message', (message) ->
  if message.type is 'options'
    options = if message.data then JSON.parse message.data else {}

    if options.shell
      impromptu.options.prompt = options.shell

    impromptu.load()
    impromptu.prompt.build (err, results) ->
      process.send
        type: 'prompt'
        data: results || ''
