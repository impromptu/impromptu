var should = require('should')
var environment = require('./environment')
var Impromptu = require('../../lib/impromptu').constructor
var exec = require('child_process').exec
var fs = require('fs')

function PromptTests(name) {
  this.name = name
}

PromptTests.prototype.shouldInitializeImpromptu = function() {
  this.impromptu = new Impromptu
  this.impromptu._setRootPath(environment.TEST_PROMPT_ROOT + '/' + this.name)
  should.exist(this.impromptu)
}

PromptTests.prototype.shouldLoadThePromptFile = function() {
  this.shouldInitializeImpromptu()
  this.impromptu.load()
  this.impromptu.prompt._orderedSections.length.should.be.ok
}

PromptTests.prototype.shouldBuildPrompt = function(fn) {
  this.shouldLoadThePromptFile()
  this.impromptu.build(function(err, prompt) {
    should.exist(prompt)
    fn(err, prompt)
  })
}

PromptTests.prototype.shouldCreateDebugLog = function(fn) {
  this.shouldBuildPrompt(function(err, prompt) {
    var exists, log
    exists = fs.existsSync(this.impromptu.config.get('path.log'))
    exists.should.be.ok
    log = exists ? fs.readFileSync(this.impromptu.config.get('path.log')).toString() : ''
    fn(err, log)
  }.bind(this))
}

PromptTests.prototype.shouldNotCreateDebugLog = function(fn) {
  this.shouldBuildPrompt(function(err, prompt) {
    var exists
    exists = fs.existsSync(this.impromptu.config.get('path.log'))
    exists.should.not.be.ok
    fn(err)
  }.bind(this))
}

PromptTests.prototype.clean = function(fn) {
  if (!this.impromptu) {
    this.shouldInitializeImpromptu()
  }
  var tmpDir = this.impromptu.config.get('path.tmp')
  var logFilePath = this.impromptu.config.get('path.log')
  exec('rm -rf ' + tmpDir + ' ' + logFilePath, fn)
  delete this.impromptu
}

module.exports = function(name, options) {
  options = options || {}
  var tests = new PromptTests(name)
  afterEach(function(done) {
    tests.clean(done)
  })
  it('should load the prompt file', function() {
    tests.shouldLoadThePromptFile()
  })
  it('should build a prompt', function(done) {
    tests.shouldBuildPrompt(done)
  })
  if (options.expectedPrompt) {
    it('should equal the expected prompt', function(done) {
      tests.shouldBuildPrompt(function(err, prompt) {
        prompt.should.equal(options.expectedPrompt)
        done(err)
      })
    })
  }
  if (options.expectedError) {
    it('should report a ' + options.expectedError.name, function(done) {
      tests.shouldBuildPrompt(function(err, prompt) {
        prompt.should.include(options.expectedError.text)
        done(err)
      })
    })
    it('should create a debug log file', function(done) {
      tests.shouldCreateDebugLog(done)
    })
    it('should log a ' + options.expectedError.name, function(done) {
      tests.shouldCreateDebugLog(function(err, log) {
        log.should.include(options.expectedError.text)
        done(err)
      })
    })
  } else {
    it('should not create a debug log file', function(done) {
      tests.shouldNotCreateDebugLog(done)
    })
  }
  return tests
}
