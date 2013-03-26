module.exports = (Impromptu, tu) ->
  tu 'db <cmd>', 'Manage the Impromptu database.', (program) ->
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