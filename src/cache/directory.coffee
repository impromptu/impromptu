Impromptu = require '../impromptu'

class Directory extends Impromptu.Cache.Global
  constructor: (impromptu, name, options = {}) ->
    directory = options.directory || process.env.PWD
    name = "#{name}:#{directory}"
    super impromptu, name, options

# Expose `Directory`.
exports = module.exports = Directory
