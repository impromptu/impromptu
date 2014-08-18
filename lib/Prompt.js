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

/**
 * Build the prompt.
 * @param {function(Error, string)} callback
 */
Prompt.prototype.build = function(callback) {
  async.waterfall([
    this._getSectionContents.bind(this),
    this._reduceSections.bind(this)
  ], callback)
}

/**
 * Fetches the contents of all sections.
 * @param {function(Error)} done
 * @private
 */
Prompt.prototype._getSectionContents = function(done) {
  async.each(this._orderedSections, this._getSectionContent.bind(this), done)
}

/**
 * Fetches the contents of a single section.
 * @param {Object} section
 * @param {function(Error)} fn
 * @private
 */
Prompt.prototype._getSectionContent = function(section, fn) {
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
    section._formattedContent = err ? '' : results

    // TODO: Log errors that aren't WhenErrors here.
    // We don't want to propagate them up, because we don't want them to block the prompt.
    fn(null)
  })
}

/**
 * Reduces sections into a single prompt.
 * @param {function(Error, string)} callback
 * @private
 */
Prompt.prototype._reduceSections = function(callback) {
  var formattedSections = this._orderedSections.filter(this._isSectionFormatted)
  var result = formattedSections.reduce(this._sectionReducer.bind(this), '')
  callback(null, result)
}

/**
 * Whether a section is formatted.
 * @param {Object} section
 * @return {boolean}
 * @private
 */
Prompt.prototype._isSectionFormatted = function(section) {
  return !!section._formattedContent
}

/**
 * Reduces the sections into a single prompt string.
 * All sections must be formatted.
 *
 * @param {string} value The prior joined sections.
 * @param {Object} section
 * @param {number} index
 * @param {Array.<Object>} sections An array of formatted sections.
 * @return {string}
 * @private
 */
Prompt.prototype._sectionReducer = function(value, section, index, sections) {
  var lastSection = sections[index - 1]
  var lastBackground = null
  if (lastSection && lastSection.options.postPadding) {
    lastBackground = lastSection.background
  }

  var content = section._formattedContent
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

  return value + content
}

module.exports = Prompt
