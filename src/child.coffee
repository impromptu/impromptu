Impromptu = require '../lib/impromptu'
impromptu = new Impromptu()

parseEnv = (printenvOutput) ->
  env = {}
  if printenvOutput
    pairs = printenvOutput.split /(?:^|\n)([a-z0-9_]+)=/i
    # Remove the first blank match.
    pairs.shift()
    for key, index in pairs by 2
      env[key] = pairs[index+1]
  env

process.on 'message', (message) ->
  if message.type is 'env'
    env = parseEnv message.data

    if env.IMPROMPTU_SHELL
      impromptu.options.shell = env.IMPROMPTU_SHELL

    # Overload the environment.
    process.env = env

    # Update the current working directory.
    try
      process.chdir env.PWD
    catch err

    # Spawn the background update process.
    Impromptu.cli.spawnBackground()

    # Load and build the prompt.
    impromptu.load()
    impromptu.prompt.build (err, results) ->
      process.send
        type: 'prompt'
        data: results || ''

      process.exit()
