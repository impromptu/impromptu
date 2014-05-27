var promptTests

promptTests = require('./shared/prompt')

describe('Prompt Files', function() {
  describe('Sample', function() {
    return promptTests('sample', {
      expectedPrompt: "\x1b[42m\x1b[37m user@host \x1b[0m\x1b[44m\x1b[37m ~/path/to/impromptu \x1b[0m"
    })
  })
  describe('CoffeeScript Compilation Error', function() {
    return promptTests('compiler-error', {
      expectedError: {
        name: 'compiler error',
        text: 'Your prompt file is not valid CoffeeScript.'
      }
    })
  })
  return describe('JavaScript Prompt Method Error', function() {
    return promptTests('load-error', {
      expectedError: {
        name: 'runtime error',
        text: 'Your prompt method triggered a JavaScript error.'
      }
    })
  })
})
