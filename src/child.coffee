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

    if env.IMPROMPTU_LOG_LEVEL
      impromptu.log.setVerbosity env.IMPROMPTU_LOG_LEVEL

    # Overload the environment.
    process.env = env

    # Update the current working directory.
    try
      process.chdir env.PWD
    catch err

    impromptu.load()
    impromptu.prompt.build (err, results) ->
      # Send back the generated prompt.
      # If no prompt is generated, we fall back to the environment's existing prompt.
      # As a result, by registering no prompt sections, Impromptu can be used strictly
      # for its background updating capabilities.
      process.send
        type: 'prompt'
        data: results || env.PS1 || ''

      # Run the background update.
      # We synchronously perform the background update to optimize for speed of prompt
      # generation. Reusing the process allows us to conserve memory while the socket
      # server is idling.
      impromptu.options.refresh = true

      # Rebuild the prompt to refresh the cache.
      impromptu.prompt.build (err, results) ->
        process.exit()
