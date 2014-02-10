var Impromptu = require('../lib/impromptu')
var minimist = require('minimist')

var argv = minimist(process.argv.slice(2), {
  defaults: {
    logfile: true,
    foreground: false
  },
  alias: {
    h: 'help',
    v: 'version'
  }
})

var impromptu = new Impromptu()
impromptu.config.set('verbosity', argv.verbosity)

impromptu.log.defaultDestinations.server = argv.foreground
impromptu.log.defaultDestinations.file = argv.logfile

var parseEnv = function(printenvOutput) {
  var env = {}
  if (printenvOutput) {
    var pairs = printenvOutput.split(/(?:^|\n)([a-z0-9_]+)=/i)

    // Remove the first blank match.
    pairs.shift()

    for (var index = 0; index < pairs.length; index += 2) {
      var key = pairs[index]
      env[key] = pairs[index + 1]
    }
  }
  return env
}

process.on('message', function(message) {
  if (message.type === 'env') {
    buildPrompt(message.data)
  } else if (message.type === 'test') {
    runTests()
  }
})

var buildPrompt = function(envString) {
  var env = parseEnv(envString)

  if (env.IMPROMPTU_SHELL) {
    impromptu.config.set('shell', env.IMPROMPTU_SHELL)
  }

  // Overload the environment.
  process.env = env

  // Update the current working directory.
  try {
    process.chdir(env.PWD)
  } catch (e) {}

  impromptu.load()
  impromptu.prompt.build(function(err, results) {
    // Send back the generated prompt.
    // If no prompt is generated, we fall back to the environment's existing prompt.
    // As a result, by registering no prompt sections, Impromptu can be used strictly
    // for its background updating capabilities. If PS1 exists, falls back to "`pwd` $".
    process.send({
      type: 'end',
      data: results || env.PS1 || ("" + (process.cwd()) + " $ ")
    })

    // Run the background update.
    // We synchronously perform the background update to optimize for speed of prompt
    // generation. Reusing the process allows us to conserve memory while the socket
    // server is idling.
    impromptu.config.set('refresh', true)

    // Rebuild the prompt to refresh the cache.
    impromptu.prompt.build(function(err, results) {
      process.exit()
    })
  })
}

// Tests
// FYI: This is ridiculous.
var runTests = function() {
  require('coffee-script')

  var path = require('path')
  var fs = require('fs')
  var Mocha = require('mocha')

  // Allow unlimited listeners for tests.
  process.setMaxListeners(0)

  var testDir = path.resolve(__dirname, '../test')
  var files = fs.readdirSync(testDir).filter(function(f) {
    return f.match(/\.coffee$/)
  })

  var mocha = new Mocha({
    reporter: 'spec'
  })

  for (var i = 0; i < files.length; i++) {
    var file = files[i]
    mocha.addFile(path.resolve(testDir, file))
  }

  mocha.run(function(failures) {
    process.send({
      type: 'shutdown'
    })
    process.exit()
  })
}
