Impromptu = require '../lib/impromptu'
impromptu = new Impromptu()

process.on 'message', (message) ->
  if message.type is 'env'
    env = {}

    if message.data
      data = message.data.split /(?:^|\n)([a-z0-9_]+)=/i
      # Remove the first blank match.
      data.shift()

      # Record the environment.
      for key, index in data by 2
        env[key] = data[index+1]

    if env.IMPROMPTU_SHELL
      impromptu.options.prompt = env.IMPROMPTU_SHELL

    # Overload the environment.
    process.env = env

    # Update the current working directory.
    try
      process.chdir env.PWD
    catch err

    impromptu.load()
    impromptu.prompt.build (err, results) ->
      process.send
        type: 'prompt'
        data: results || ''
