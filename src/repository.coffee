Impromptu = require './impromptu'
async = require 'async'
_ = require 'underscore'

# Represents the current repository to Impromptu, so modules can act upon
# repository data.
class Repository
  constructor: (@impromptu) ->


  # The type of repository (e.g. git, svn).
  type: 'fallback'


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


class RepositoryFactory
  constructor: (@impromptu) ->
    @_repositories = []
    @register 'fallback'


  # Register a new repository.
  register: (type, options = {}) ->
    # Build the repository.
    options.type = type
    repository = new Repository @impromptu
    _.extend repository, options

    # Track the new repository.
    @_repositories.unshift repository

    # Expose the repository as a property of the factory.
    @[type] = repository


  # Find and the primary repository.
  primary: (fn) ->
    fn null, @_primary if @_primary

    # Track whether each repository exists.
    exists = {}

    async.each @_repositories, (repository, done) =>
      repository.exists (err, result) =>
        exists[repository.type] = result
        return if @_primary

        # Find the highest priority (last registered) repository that exists.
        for repository in @_repositories
          # We don't know whether this repository exists. Bail.
          break if typeof exists[repository.type] isnt 'boolean'

          # This repository exists, and all higher priority repositories do not.
          # We've found the primary repository.
          if exists[repository.type]
            @_primary = repository
            fn null, @_primary


  # Finds the root of the primary repository.
  root: (fn) ->
    @primary (err, repository) ->
      return fn err if err
      repository.root fn


  # Finds the branch of the primary repository.
  branch: (fn) ->
    @primary (err, repository) ->
      return fn err if err
      repository.branch fn


  # Finds the commit of the primary repository.
  commit: (fn) ->
    @primary (err, repository) ->
      return fn err if err
      repository.commit fn


# Expose `RepositoryFactory`.
exports = module.exports = RepositoryFactory
