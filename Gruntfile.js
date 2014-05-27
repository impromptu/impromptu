var fs = require('fs')
var path = require('path')
var child_process = require('child_process')
var exec = child_process.exec
var spawn = child_process.spawn

module.exports = function(grunt) {
  grunt.initConfig({
    jshint: {
      options: {
        jshintrc: true
      },
      lib: ['lib/**/*.js']
    },
    watch: {
      lib: {
        files: ['lib/**/*.js'],
        tasks: ['jshint', 'test']
      },
      test: {
        files: ['test/**/*.js', 'Gruntfile.js'],
        tasks: ['test']
      }
    }
  })

  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks('grunt-contrib-jshint')

  grunt.registerTask('test', ['jshint', 'unit'])
  grunt.registerTask('default', ['test'])

  grunt.registerTask('nuke', "Nuke stuff. Don't run this unless you know what you're doing.", function() {
    var steps = ['rm -rf ~/.impromptu', 'git clean -fdx']
    exec(steps.join(' && '))
  })

  // Run the unit tests by spawning an Impromptu server and passing through the 'test' message.
  // This allows us to run the tests in a real-world environment: the database requires an
  // Impromptu server and worker process to work correctly.
  grunt.registerTask('unit', 'Run unit tests.', function() {
    var done = this.async()
    var cmd = "IMPROMPTU_PORT=2934 IMPROMPTU_UNIX_DOMAIN_SOCKET='' impromptu server"

    exec(cmd + ' shutdown', function(err, stdout, stderr) {
      var server = exec(cmd + ' foreground')
      server.stdout.pipe(process.stdout)
      server.stderr.pipe(process.stderr)

      // Grunt is kind of weird here. Passing boolean false to done indicates that
      // there was an error.
      server.on('exit', function(code) {
        done(code === 0)
      })

      setTimeout(function() {
        exec(cmd + ' test')
      }, 1000)
    })
  })
}
