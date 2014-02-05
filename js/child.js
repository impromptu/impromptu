(function() {
  var Impromptu, argv, buildPrompt, impromptu, minimist, parseEnv, runTests;

  Impromptu = require('../lib/impromptu');

  minimist = require('minimist');

  argv = minimist(process.argv.slice(2), {
    defaults: {
      logfile: true,
      foreground: false
    },
    alias: {
      h: 'help',
      v: 'version'
    }
  });

  impromptu = new Impromptu({
    verbosity: argv.verbosity
  });

  impromptu.log.defaultDestinations.server = argv.foreground;

  impromptu.log.defaultDestinations.file = argv.logfile;

  parseEnv = function(printenvOutput) {
    var env, index, key, pairs, _i, _len;

    env = {};
    if (printenvOutput) {
      pairs = printenvOutput.split(/(?:^|\n)([a-z0-9_]+)=/i);
      pairs.shift();
      for (index = _i = 0, _len = pairs.length; _i < _len; index = _i += 2) {
        key = pairs[index];
        env[key] = pairs[index + 1];
      }
    }
    return env;
  };

  process.on('message', function(message) {
    if (message.type === 'env') {
      return buildPrompt(message.data);
    } else if (message.type === 'test') {
      return runTests();
    }
  });

  buildPrompt = function(envString) {
    var env, err;

    env = parseEnv(envString);
    if (env.IMPROMPTU_SHELL) {
      impromptu.options.shell = env.IMPROMPTU_SHELL;
    }
    process.env = env;
    try {
      process.chdir(env.PWD);
    } catch (_error) {
      err = _error;
    }
    impromptu.load();
    return impromptu.prompt.build(function(err, results) {
      process.send({
        type: 'end',
        data: results || env.PS1 || ("" + (process.cwd()) + " $ ")
      });
      impromptu.options.refresh = true;
      return impromptu.prompt.build(function(err, results) {
        return process.exit();
      });
    });
  };

  runTests = function() {
    var Mocha, file, files, fs, mocha, path, testDir, _i, _len,
      _this = this;

    path = require('path');
    fs = require('fs');
    require('coffee-script');
    Mocha = require('mocha');
    process.setMaxListeners(0);
    testDir = path.resolve(__dirname, '../test');
    files = fs.readdirSync(testDir).filter(function(f) {
      return f.match(/\.coffee$/);
    });
    mocha = new Mocha({
      reporter: 'spec'
    });
    for (_i = 0, _len = files.length; _i < _len; _i++) {
      file = files[_i];
      mocha.addFile(path.resolve(testDir, file));
    }
    return mocha.run(function(failures) {
      process.send({
        type: 'shutdown'
      });
      return process.exit();
    });
  };

}).call(this);
