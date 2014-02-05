var Impromptu = require('../lib/impromptu');
var minimist = require('minimist');

var argv = minimist(process.argv.slice(2), {
  defaults: {
    logfile: true,
    foreground: false
  },
  alias: {
    h: 'help',
    v: 'version'
  }
});

var impromptu = new Impromptu({
  verbosity: argv.verbosity
});

impromptu.log.defaultDestinations.server = argv.foreground;

impromptu.log.defaultDestinations.file = argv.logfile;

var parseEnv = function(printenvOutput) {
  var env = {};
  if (printenvOutput) {
    var pairs = printenvOutput.split(/(?:^|\n)([a-z0-9_]+)=/i);
    pairs.shift();

    for (var index = 0; index < pairs.length; index += 2) {
      var key = pairs[index];
      env[key] = pairs[index + 1];
    }
  }
  return env;
};

process.on('message', function(message) {
  if (message.type === 'env') {
    buildPrompt(message.data);
  } else if (message.type === 'test') {
    runTests();
  }
});

var buildPrompt = function(envString) {
  var env = parseEnv(envString);
  if (env.IMPROMPTU_SHELL) {
    impromptu.options.shell = env.IMPROMPTU_SHELL;
  }
  process.env = env;
  try {
    process.chdir(env.PWD);
  } catch (e) {}
  impromptu.load();
  impromptu.prompt.build(function(err, results) {
    process.send({
      type: 'end',
      data: results || env.PS1 || ("" + (process.cwd()) + " $ ")
    });
    impromptu.options.refresh = true;
    impromptu.prompt.build(function(err, results) {
      process.exit();
    });
  });
};

var runTests = function() {
  require('coffee-script');

  var path = require('path');
  var fs = require('fs');
  var Mocha = require('mocha');

  process.setMaxListeners(0);

  var testDir = path.resolve(__dirname, '../test');
  var files = fs.readdirSync(testDir).filter(function(f) {
    return f.match(/\.coffee$/);
  });

  var mocha = new Mocha({
    reporter: 'spec'
  });

  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    mocha.addFile(path.resolve(testDir, file));
  }

  mocha.run(function(failures) {
    process.send({
      type: 'shutdown'
    });
    process.exit();
  });
};
