module.exports = (Impromptu, command) ->
  command 'db',
    desc: 'Manage the Impromptu database.'


  command 'db start',
    desc: 'Start the database daemon.'

    fn: (done) ->
      Impromptu.db.client().on 'connect', done


  command 'db shutdown',
    desc: 'Shut down the database daemon.'

    fn: (done) ->
      Impromptu.db.shutdown()
      Impromptu.db.client().on 'end', done