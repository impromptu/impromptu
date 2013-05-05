fs = require 'fs'
path = require 'path'
Mocha = require 'mocha'
exec = require('child_process').exec

module.exports = (grunt) ->

  # Project configuration.
  grunt.initConfig
    mocha:
      db:
        src: ['test/db/*.coffee']
      default:
        src: ['test/*.coffee']

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
        tasks: ['coffee', 'mocha']

      test:
        files: ['test/**/*.coffee']
        tasks: ['mocha']

  # These plugins provide necessary tasks.
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-watch'

  # Default task.
  grunt.registerTask 'default', ['coffee', 'mocha:default']

  grunt.registerTask 'nuke', "Nuke stuff. Don't run this unless you know what you're doing.", ->
    steps = [
      'rm -rf ~/.impromptu'
      'brew uninstall redis cmake'
      'git clean -fdx'
    ]

    exec steps.join ' && '

  # Task for running Mocha tests with coffee.
  grunt.registerMultiTask 'mocha', 'Run mocha unit tests.', ->
    done = @async()

    mocha = new Mocha
      reporter: 'spec'

    for files in @files
      for file in files.src
        mocha.addFile file

    mocha.run (failures) =>
      if failures
        grunt.log.error(failures).writeln()
      done()
