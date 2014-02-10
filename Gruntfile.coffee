fs = require 'fs'
path = require 'path'
child_process = require('child_process')
exec = child_process.exec
spawn = child_process.spawn


module.exports = (grunt) ->

  # Project configuration.
  grunt.initConfig
    jshint:
      options:
        jshintrc: true
      lib: ['lib/**/*.js']

    watch:
      lib:
        files: ['lib/**/*.js']
        tasks: ['jshint', 'test']

      test:
        files: ['test/**/*.coffee', 'Gruntfile.coffee']
        tasks: ['test']

  # These plugins provide necessary tasks.
  grunt.loadNpmTasks 'grunt-contrib-watch'
  grunt.loadNpmTasks 'grunt-contrib-jshint'

  # Default task.
  grunt.registerTask 'default', ['jshint', 'test']

  grunt.registerTask 'nuke', "Nuke stuff. Don't run this unless you know what you're doing.", ->
    steps = [
      'rm -rf ~/.impromptu'
      'git clean -fdx'
    ]

    exec steps.join ' && '

  # Run the unit tests by spawning an Impromptu server and passing through the 'test' message.
  # This allows us to run the tests in a real-world environment: the database requires an
  # Impromptu server and worker process to work correctly.
  grunt.registerTask 'test', 'Run unit tests.', ->
    done = @async()

    cmd = "IMPROMPTU_PORT=2934 IMPROMPTU_UNIX_DOMAIN_SOCKET='' impromptu server"

    exec "#{cmd} shutdown", (err, stdout, stderr) ->
      server = exec "#{cmd} foreground"
      server.stdout.pipe process.stdout
      server.stderr.pipe process.stderr

      setTimeout ->
        exec "#{cmd} test"
      , 1000 # chill out for a bit
