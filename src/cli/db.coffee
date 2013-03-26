Impromptu = require '../impromptu'
commander = require 'commander'

module.exports = ->
  program = new commander.Command 'tu db'

  program
    .command('start')
    .description('Start the database daemon.')
    .action =>
      done = @async()
      Impromptu.db.client().on 'connect', ->
        done()

  program
    .command('shutdown')
    .description('Shut down the database daemon.')
    .action =>
      done = @async()
      Impromptu.db.shutdown()
      Impromptu.db.client().on 'end', ->
        done()

  # Make it go.
  program.parse @argv