Impromptu = require './impromptu'
spawn = require('child_process').spawn
path = require 'path'

module.exports = ->
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

  # Spawn the background process to asynchronously update the cache.
  backgroundPath = path.resolve "#{__dirname}/../bin/impromptu-background"
  background = spawn backgroundPath, [],
    stdio: 'ignore'
    detached: true
    cwd: process.cwd()

  background.unref()

  # Build the prompt.
  new Impromptu({shell: process.argv[2]}).load().prompt.build (err, results) ->
    process.stdout.write results if results
    process.exit()
