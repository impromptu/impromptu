Impromptu = require './impromptu'
async = require 'async'

# Represents the current repository to Impromptu, so modules can act upon
# repository data.
class Repository
  constructor: (@impromptu) ->


  # The type of repository (e.g. git, svn).
  type: 'directory'


  # Whether the repository exists.
  # Defaults to checking for the repository root.
  #
  # Receives a callback `fn`, which accepts an error `err` and a boolean `exists`.
  exists: (fn) ->
    @root (err, root) ->
      fn err, !!root



  # The path to the root of the repository.
  # Defaults to the current working directory.
  #
  # Receives a callback `fn`, which accepts an error `err` and a string `path`.
  root: (fn) ->
    fn null, process.cwd()


  # A unique key to identify the repository.
  # Defaults to using the repository's root path.
  #
  # Certain version control systems may need to augment this value.
  # Our convention is to join the various pieces of a key with `:`.
  #
  # Receives a callback `fn`, which accepts an error `err` and a string `key`.
  key: (fn) ->
    @root fn


# Expose `Repository`.
exports = module.exports = Repository
