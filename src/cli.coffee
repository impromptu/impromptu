Impromptu = require './impromptu'
spawn = require('child_process').spawn
path = require 'path'

cli = {}

cli.run = ->
  # Show the version if that's all you asked for.
  if process.argv[2] is '--version' or process.argv[2] is '-v'
    console.log Impromptu.VERSION
    process.exit()

  # Help text
  if process.argv[2] is '--help' or process.argv[2] is '-h'
    console.log """
      Impromptu version #{Impromptu.VERSION}

      To generate your prompt using Impromptu, add 'source impromptu' to the end of your shell's configuration file.

      You might want to run something like `echo 'source impromptu' >> ~/.bash_profile` on a default OS X install.
    """
    process.exit()

  cli.spawnBackground()

  # Build the prompt.
  new Impromptu({shell: process.argv[2]}).load().prompt.build (err, results) ->
    process.stdout.write results if results
    process.exit()


cli.runBackground = ->
  new Impromptu({background: true}).load().prompt.build (err, results) ->
    process.exit()


cli.spawnBackground = ->
  # Spawn the background process to asynchronously update the cache.
  backgroundPath = path.resolve "#{__dirname}/../bin/impromptu-background"
  background = spawn backgroundPath, [],
    stdio: 'ignore'
    detached: true
    cwd: process.cwd()
    env: process.env

  background.unref()

module.exports = cli
