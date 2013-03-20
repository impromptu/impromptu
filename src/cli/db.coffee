Impromptu = require '../impromptu'
program = require 'commander'
fs = require 'fs'

program
  .command('start')
  .description('Start the database daemon.')
  .action ->
    client = new Impromptu.DB().client()
    client.on 'connect', ->
      process.exit()

program
  .command('shutdown')
  .description('Shut down the database daemon.')
  .action ->
    new Impromptu.DB().shutdown()
    process.exit()

program.name = 'tu-db'

# Make it go.
program.parse process.argv