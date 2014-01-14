fs = require 'fs'
path = require 'path'
child_process = require('child_process')
exec = child_process.exec
spawn = child_process.spawn


module.exports = (grunt) ->

  # Project configuration.
  grunt.initConfig
    coffee:
      default:
        files: [
          expand: true         # Enable dynamic expansion.
          cwd: 'src/'          # Src matches are relative to this path.
          src: ['**/*.coffee'] # Actual pattern(s) to match.
          dest: 'lib/'         # Destination path prefix.
          ext: '.js'           # Dest filepaths will have this extension.
        ]

    watch:
      src:
        files: ['src/**/*.coffee']
        tasks: ['coffee', 'test']

      test:
        files: ['test/**/*.coffee', 'Gruntfile.coffee']
        tasks: ['test']

  # These plugins provide necessary tasks.
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-watch'

  # Default task.
  grunt.registerTask 'default', ['coffee', 'test']

  grunt.registerTask 'nuke', "Nuke stuff. Don't run this unless you know what you're doing.", ->
    steps = [
      'rm -rf ~/.impromptu'
      'brew uninstall redis'
      'git clean -fdx'
    ]

    exec steps.join ' && '

  # Run the unit tests by spawning an Impromptu server and passing through the 'test' message.
  # This allows us to run the tests in a real-world environment: the database requires an
  # Impromptu server and worker process to work correctly.
  grunt.registerTask 'test', 'Run unit tests.', ->
    done = @async()

    cmd = "IMPROMPTU_PORT=2934 impromptu server"

    exec "#{cmd} shutdown", (err, stdout, stderr) ->
      server = exec "#{cmd} foreground"
      server.stdout.pipe process.stdout
      server.stderr.pipe process.stderr

      setTimeout ->
        exec "#{cmd} test"
      , 1000 # chill out for a bit
