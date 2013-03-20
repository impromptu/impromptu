commander = require 'commander'
fs = require 'fs'

commander
  .version JSON.parse(fs.readFileSync(__dirname + '/../package.json', 'utf8')).version

commander.name = 'impromptu'

# Make it go.
commander.parse process.argv