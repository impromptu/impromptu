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
        tasks: ['coffee', 'mocha']

      test:
        files: ['test/**/*.js']
        tasks: ['mocha']

  # These plugins provide necessary tasks.
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-contrib-watch'

  # Default task.
  grunt.registerTask 'default', ['coffee', 'mocha']

  # Task for running Mocha tests with coffee.
  grunt.registerTask 'mocha', 'Run mocha unit tests.', ->
    done = @async()
    mocha =
      cmd: 'mocha'
      args: ['--compilers','coffee:coffee-script','--colors','--reporter','spec']
    grunt.util.spawn mocha, (error, result) ->
      if error
        grunt.log.ok( result.stdout ).error( result.stderr ).writeln()
        done new Error('Error running mocha unit tests.')
      else
        grunt.log.ok( result.stdout ).writeln()
        done()

