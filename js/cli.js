var Impromptu, path, spawn;

Impromptu = require('./impromptu');

spawn = require('child_process').spawn;

path = require('path');

module.exports = function() {
  var background, backgroundPath;

  if (process.argv[2] === '--version' || process.argv[2] === '-v') {
    console.log(Impromptu.VERSION);
    process.exit();
  }
  if (process.argv[2] === '--help' || process.argv[2] === '-h') {
    console.log("Impromptu version " + Impromptu.VERSION + "\n\nTo generate your prompt using Impromptu, add 'source impromptu' to the end of your shell's configuration file.\n\nYou might want to run something like `echo 'source impromptu' >> ~/.bash_profile` on a default OS X install.");
    process.exit();
  }
  backgroundPath = path.resolve("" + __dirname + "/../bin/impromptu-refresh");
  background = spawn(backgroundPath, [], {
    stdio: 'ignore',
    detached: true,
    cwd: process.cwd(),
    env: process.env
  });
  background.unref();
  return new Impromptu({
    shell: process.argv[2],
    verbosity: process.env.IMPROMPTU_LOG_LEVEL
  }).load().prompt.build(function(err, results) {
    if (results) {
      process.stdout.write(results);
    }
    return process.exit();
  });
};
