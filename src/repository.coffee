Impromptu = require './impromptu'
async = require 'async'

# Represents the current repository to Impromptu, so modules can act upon
# repository data.
class Repository
  constructor: (@impromptu) ->


  # The type of repository (e.g. git, svn).
  type: 'directory'


  # The path to the root of the repository.
  # Defaults to the current working directory.
  #
  # Receives a callback `fn`, which accepts an error `err` and a string `path`.
  root: (fn) ->
    fn null, process.env.PWD


  # The current branch of the repository, if the repository supports branches.
  #
  # Receives a callback `fn`, which accepts an error `err` and a string `branch`.
  branch: (fn) ->
    fn null, ''


  # The current commit of the repository, if the repository supports commits.
  #
  # Receives a callback `fn`, which accepts an error `err` and a string `commit`.
  commit: (fn) ->
    fn null, ''


  # Whether the repository exists.
  # Defaults to checking for the repository root.
  #
  # Receives a callback `fn`, which accepts an error `err` and a boolean `exists`.
  exists: (fn) ->
    @root (err, root) ->
      fn err, !!root


# Expose `Repository`.
exports = module.exports = Repository
