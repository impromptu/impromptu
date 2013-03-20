Impromptu = require '../impromptu'
program = require 'commander'
fs = require 'fs'

program
  .command('start')
  .description('Start the database daemon.')
  .action ->
    Impromptu.db.client().on 'connect', ->
      process.exit()

program
  .command('shutdown')
  .description('Shut down the database daemon.')
  .action ->
    Impromptu.db.shutdown()
    Impromptu.db.client().on 'end', ->
      process.exit()

program.name = 'tu-db'

# Make it go.
program.parse process.argv