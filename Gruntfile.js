var fs = require('fs')
var path = require('path')
var child_process = require('child_process')
var exec = child_process.exec
var spawn = child_process.spawn

module.exports = function(grunt) {
  grunt.initConfig({
    eslint: {
      src: ['lib/**/*.js']
    },
    watch: {
      lib: {
        files: ['lib/**/*.js'],
        tasks: ['eslint', 'test']
      },
      test: {
        files: ['test/**/*.js', 'Gruntfile.js'],
        tasks: ['test']
      }
    }
  })

  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks("gruntify-eslint")

  grunt.registerTask('test', ['eslint', 'unit', 'check-types'])
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
    var cmd = [
      'IMPROMPTU_PORT=2934',
      "IMPROMPTU_UNIX_DOMAIN_SOCKET=''",
      "IMPROMPTU_TESTING=1",
      'IMPROMPTU_DIR=' + __dirname,
      './bin/impromptu server'
    ].join(' ')

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

  grunt.registerTask('check-types', 'Checks the types of Impromptu using Closure Compiler.', function() {
    var done = this.async()
    var checkTypes = exec('./node_modules/.bin/closure-npc', function(err, stdout, stderr) {
      var results = stderr.trim().split('\n').pop()
      var errorMatch = /(\d+) error\(s\)/.exec(results)
      var succeeded = errorMatch && parseInt(errorMatch[1], 10) === 0
      done(succeeded)
    })

    checkTypes.stdout.pipe(process.stdout)
    checkTypes.stderr.pipe(process.stderr)
  })
}
