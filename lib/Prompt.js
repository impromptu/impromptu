var BaseError = require('./Error')
var util = require('util')
var async = require('async')
var _ = require('underscore')

// Required for type checking.
var Color = require('./Color')

/**
 * A custom error for when the `when` requirements fail.
 * @constructor
 * @extends {BaseError}
 * @param {string=} message
 */
var WhenError = function (message) {
  BaseError.apply(this, arguments)
}
util.inherits(WhenError, BaseError)

// Allows any input to be treated asynchronously.
var makeAsync = function(input, callback) {
  // Handle non-function `input`.
  if (!_.isFunction(input)) {
    callback(null, input)
    return
  }

  // Handle asynchronous `input` function.
  if (input.length) {
    input(callback)
    return
  }

  // Handle synchronous `input` function.
  var results = null
  var err = null
  try {
    results = input()
  } catch (e) {
    err = e
  }

  callback(err, results)
}

/**
 * @param {Color} color
 * @constructor
 */
function Prompt(color) {
  /** @private {Color} */
  this._color = color

  this.section = this.section.bind(this)
  // Create a completely empty object.
  this._sections = Object.create(null)
  this._orderedSections = []
}

Prompt.prototype.section = function(key, properties) {
  // Create the section if it doesn't already exist.
  if (!this._sections[key]) {
    this._sections[key] = {
      background: 'default',
      foreground: 'default',
      options: {
        newlines: false,
        prePadding: true,
        postPadding: true
      }
    }
    this._orderedSections.push(this._sections[key])
  }

  var section = this._sections[key]

  // Ensure `when` is an array.
  if ((properties.when != null) && !_.isArray(properties.when)) {
    properties.when = [properties.when]
  }

  // Apply changes to the `options` object to prevent
  // it from being overwritten below.
  _.extend(section.options, properties.options)
  delete properties.options

  // Apply changes to the section properties.
  _.extend(section, properties)
}

// Build the prompt.
Prompt.prototype.build = function(fn) {
  async.waterfall([
    function(done) {
      async.each(this._orderedSections, function(section, complete) {
        this._content(section, function(err, content) {
          if (!err) {
            section._formattedContent = content
          }
          complete()
        })
      }.bind(this), done)
    }.bind(this),

    function(done) {
      var lastBackground = null
      var result = this._orderedSections.reduce(function(value, section) {
        var content = section._formattedContent
        if (!content) {
          return value
        }

        var options = section.options

        // Pad both sides of the content with spaces.
        // If two sections have the same background color, link them with a single space.
        // If the content begins or ends in whitespace, do not pad that side.
        if (options.postPadding && /\S$/.test(content)) {
          content += ' '
        }
        if (section.background !== lastBackground && options.prePadding && /^\S/.test(content)) {
          content = ' ' + content
        }

        content = this._color.format(content, {
          foreground: section.foreground,
          background: section.background
        })

        lastBackground = options.postPadding ? section.background : null

        return value + content
      }.bind(this), '')

      done(null, result)
    }.bind(this)
  ], fn)
}

Prompt.prototype._content = function(section, fn) {
  async.waterfall([
    function(done) {
      if (!section.when) {
        done(null)
        return
      }

      // `section.when` is an array of mixed values
      async.every(section.when, function(item, callback) {
        makeAsync(item, function(err, results) {
          callback(!!results)
        })
      }, function(success) {
        if (success) {
          done(null)
        } else {
          done(new WhenError())
        }
      })
    },

    function(done) {
      // Ensure `content` is an array.
      var content = [].concat(section.content)
      async.map(content, makeAsync, done)
    },

    function(results, done) {
      if (section.format) {
        results = section.format.apply(section, results)
      } else {
        results = results.join('')
      }

      // Ensure the content is a string.
      results = results ? results.toString() : ''

      // Strip newlines unless they're explicitly requested.
      if (!section.options.newlines) {
        results = results.replace(/\n/g, '')
      }

      done(null, results)
    }
  ], function(err, results) {
    // If `section.when` fails, just pass along blank content.
    if (err instanceof WhenError) {
      return fn(null, '')
    } else {
      return fn(err, results)
    }
  })
}

module.exports = Prompt
