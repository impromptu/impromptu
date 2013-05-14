Impromptu = require './impromptu'
async = require 'async'
_ = require 'underscore'

# Create a custom error for when the `when` requirements fail.
class WhenError extends Impromptu.Error

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
  constructor: (@impromptu) ->
    # Create a completely empty object.
    @_sections = Object.create null
    @_orderedSections = []


  section: (key, properties) =>
    # Create the section if it doesn't already exist.
    unless @_sections[key]
      @_sections[key] =
        background: 'default'
        foreground: 'default'
        options:
          newlines: false
          prePadding: true
          postPadding: true

      @_orderedSections.push @_sections[key]

    section = @_sections[key]

    # `when` is always an array.
    if properties.when? and not _.isArray properties.when
      properties.when = [properties.when]

    # Apply changes to the `options` object to prevent
    # it from being overwritten below.
    _.extend section.options, properties.options
    delete properties.options

    # Apply changes to the section properties.
    _.extend section, properties


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
        result = @_orderedSections.reduce (value, section) =>
          content = section._formattedContent
          return value unless content

          options = section.options

          # Pad both sides of the content with spaces.
          # If two sections have the same background color, link them with a single space.
          # If the content begins or ends in whitespace, do not pad that side.
          if options.postPadding and /\S$/.test content
            content = "#{content} "
          if section.background isnt lastBackground and options.prePadding and /^\S/.test content
            content = " #{content}"

          content = @impromptu.color.format content,
            foreground: section.foreground
            background: section.background

          lastBackground = if options.postPadding then section.background else null

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
          results = section.format.apply section, results
        else
          results = results.join ''

        # Ensure the content is a string.
        results = if results then results.toString() else ''

        # Strip newlines unless they're explicitly requested
        results = results.replace(/\n/g, '') unless section.options.newlines

        done null, results
    ], (err, results) ->
      # If `section.when` fails, just pass along blank content.
      if err instanceof WhenError
        fn null, ''
      else
        fn err, results


# Expose `Prompt`.
exports = module.exports = Prompt