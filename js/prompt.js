// TODO: Update for style, copy comments.
var Impromptu, Prompt, WhenError, async, exports, makeAsync, _, _ref,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

Impromptu = require('./impromptu');

async = require('async');

_ = require('underscore');

WhenError = (function(_super) {
  __extends(WhenError, _super);

  function WhenError() {
    _ref = WhenError.__super__.constructor.apply(this, arguments);
    return _ref;
  }

  return WhenError;

})(Impromptu.Error);

makeAsync = function(input, callback) {
  var err, results;

  if (!_.isFunction(input)) {
    return callback(null, input);
  }
  if (input.length) {
    return input(callback);
  }
  try {
    return results = input();
  } catch (_error) {
    err = _error;
  } finally {
    callback(err, results);
  }
};

Prompt = (function() {
  function Prompt(impromptu) {
    this.impromptu = impromptu;
    this.section = __bind(this.section, this);
    this._sections = Object.create(null);
    this._orderedSections = [];
  }

  Prompt.prototype.section = function(key, properties) {
    var section;

    if (!this._sections[key]) {
      this._sections[key] = {
        background: 'default',
        foreground: 'default',
        options: {
          newlines: false,
          prePadding: true,
          postPadding: true
        }
      };
      this._orderedSections.push(this._sections[key]);
    }
    section = this._sections[key];
    if ((properties.when != null) && !_.isArray(properties.when)) {
      properties.when = [properties.when];
    }
    _.extend(section.options, properties.options);
    delete properties.options;
    return _.extend(section, properties);
  };

  Prompt.prototype.build = function(fn) {
    var _this = this;

    return async.waterfall([
      function(done) {
        return async.each(_this._orderedSections, function(section, complete) {
          return _this._content(section, function(err, content) {
            if (!err) {
              section._formattedContent = content;
            }
            return complete();
          });
        }, done);
      }, function(done) {
        var lastBackground, result;

        lastBackground = null;
        result = _this._orderedSections.reduce(function(value, section) {
          var content, options;

          content = section._formattedContent;
          if (!content) {
            return value;
          }
          options = section.options;
          if (options.postPadding && /\S$/.test(content)) {
            content = "" + content + " ";
          }
          if (section.background !== lastBackground && options.prePadding && /^\S/.test(content)) {
            content = " " + content;
          }
          content = _this.impromptu.color.format(content, {
            foreground: section.foreground,
            background: section.background
          });
          lastBackground = options.postPadding ? section.background : null;
          return value + content;
        }, '');
        return done(null, result);
      }
    ], fn);
  };

  Prompt.prototype._content = function(section, fn) {
    return async.waterfall([
      function(done) {
        if (!section.when) {
          return done(null);
        }
        return async.every(section.when, function(item, callback) {
          return makeAsync(item, function(err, results) {
            return callback(!!results);
          });
        }, function(success) {
          if (success) {
            return done(null);
          } else {
            return done(new WhenError());
          }
        });
      }, function(done) {
        var content;

        content = [].concat(section.content);
        return async.map(content, makeAsync, done);
      }, function(results, done) {
        if (section.format) {
          results = section.format.apply(section, results);
        } else {
          results = results.join('');
        }
        results = results ? results.toString() : '';
        if (!section.options.newlines) {
          results = results.replace(/\n/g, '');
        }
        return done(null, results);
      }
    ], function(err, results) {
      if (err instanceof WhenError) {
        return fn(null, '');
      } else {
        return fn(err, results);
      }
    });
  };

  return Prompt;

})();

exports = module.exports = Prompt;
