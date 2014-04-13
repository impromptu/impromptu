var impromptu = require('../lib/impromptu')
var minimist = require('minimist')
var domain = require('domain').create()

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

impromptu.config.set('verbosity', argv.verbosity)

impromptu.log.defaultDestinations.server = argv.foreground
impromptu.log.defaultDestinations.file = argv.logfile

domain.on('error', function (err) {
  try {
    var killtimer = setTimeout(function () {
      process.exit()
    }, 5000)
    killtimer.unref()

    if (process.connected) {
      process.send({
        type: 'end',
        data: impromptu.fallback()
      })
    }

    impromptu.log.warning("worker error\n\n" + err.stack + "\n----------------------------------------")

    if (process.connected) {
      process.disconnect()
    } else {
      process.kill()
    }
  } catch (e) {
    process.kill()
  }
})

domain.run(function () {
  impromptu.load()
})

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
    domain.run(function () {
      buildPrompt(message.data)
    })
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

  impromptu.build(function(err, results) {
    // Send back the generated prompt.
    // If no prompt is generated, we fall back to the environment's existing prompt.
    // As a result, by registering no prompt sections, Impromptu can be used strictly
    // for its background updating capabilities. If PS1 exists, falls back to "`pwd` $".
    process.send({
      type: 'end',
      data: results || env.PS1 || impromptu.fallback()
    })

    // Run the background update.
    // We synchronously perform the background update to optimize for speed of prompt
    // generation. Reusing the process allows us to conserve memory while the socket
    // server is idling.
    impromptu.refresh()

    // Rebuild the prompt to refresh the cache.
    impromptu.prompt.build(function(err, results) {
      process.exit()
    })

    // Set a time limit for background updates.
    // TODO: Add more robust process management/collection to the server.
    var killtimer = setTimeout(function() {
      process.exit()
    }, 60000)
    // But don't keep the process open just for that!
    killtimer.unref()
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
    var exitCode = failures === 0 ? 0 : 1

    process.send({
      type: 'shutdown',
      code: exitCode
    })
    process.exit(failures)
  })
}
