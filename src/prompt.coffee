Impromptu = require './impromptu'
async = require 'async'
_ = require 'underscore'


# Since the `Error` constructor is a JS native, and can be called without the
# `new` keyword, CoffeeScript's inheritance breaks by default. This is fixed by
# assigning the constructor to the actual `Error` method (which doubles as its
# constructor), thereby allowing normal inheritance to occur. Cool? Cool.
class WhenError extends Error
  constructor: ->
    super


# Allows any input to be treated asynchronously.
makeAsync = (input, callback) ->
  # Handle non-function `input`.
  return callback null, input unless _.isFunction input

  # Handle asynchronous `input` function.
  return input callback if input.length

  # Handle synchronous `input` function.
  try
    results = input()
  catch err
  finally
    callback err, results


class Prompt
  constructor: ->
    # Create a completely empty object.
    @_sections = Object.create null
    @_orderedSections = []


  section: (key, options) ->
    # Create the section if it doesn't already exist.
    unless @_sections[key]
      @_sections[key] = {}
      @_orderedSections.push @_sections[key]

    section = @_sections[key]

    # `when` is always an array.
    if options.when? and not _.isArray options.when
      options.when = [options.when]

    _.extend section, options


  # Build the prompt.
  build: (fn) ->
    async.waterfall [
      (done) =>
        async.each @_orderedSections, (section, complete) =>
          @_content section, (err, content) ->
            section._formattedContent = content
            complete()
        , done

      (done) =>
        lastBackground = null
        result = @_orderedSections.reduce (value, section) ->
          content = section._formattedContent
          return value unless content

          # If two sections have the same background color, link them with a single space.
          # Otherwise, pad both sides of the content with spaces.
          content = "#{content} "
          content = " #{content}" unless section.background is lastBackground

          content = Impromptu.color content,
            foreground: section.foreground
            background: section.background

          lastBackground = section.background

          value + content
        , ''

        done null, result
    ], fn

  _content: (section, fn) ->
    async.waterfall [
      (done) ->
        return done null unless section.when

        # `section.when` is an array of mixed values
        async.every section.when, (item, callback) ->
          makeAsync item, (err, results) ->
            callback !!results
        , (success) ->
          if success
            done null
          else
            done new WhenError()

      (done) ->
        # Ensure `content` is an array.
        content = [].concat section.content
        async.map content, makeAsync, done

      (results, done) ->
        if section.format
          results = section.format.apply @, results
        else
          results = results.join ''

        done null, results.toString().replace(/\n/g, '')
    ], (err, results) ->
      # If `section.when` fails, just pass along blank content.
      if err instanceof WhenError
        fn null, ''
      else
        fn err, results


# Expose `Prompt`.
exports = module.exports = Prompt