[![Build Status](https://travis-ci.org/Impromptu/impromptu.png)](https://travis-ci.org/Impromptu/impromptu)

# Impromptu

A sentient prompt.


## Installation

The easiest way to install Impomptu is to grab it from NPM.

`npm install -g impromptu`

Note the `-g`, it's important that Impromptu is installed globally.

Once you have Impromptu installed (or if you want more details on installing it) jump to the [Getting Started](https://github.com/Impromptu/impromptu/blob/master/docs/getting-started.md) documentation.

## Philosophy

### On Prompts
* Prompts should be aware of the internet, and able to show relevant information from it.
* Prompts should show relevant information when you need it, and nothing else.
* Prompts should use colors so that they're visually easy to parse.
* Prompts should be prompt. Performance is paramount.

### On Impromptu
* Impromptu should be self-documenting.
* Impromptu should be easily extensible.


## Development

Impromptu uses [Grunt](http://gruntjs.com/).

### Install
After checking out Impromptu, run `npm install` in the `impromptu` directory.

If you don't have the [grunt-cli](https://github.com/gruntjs/grunt-cli) package installed globally, run `npm install -g grunt-cli`.

### Development
In the `impromptu` directory, run `grunt` to build and test Impromptu.

Run `grunt watch` to continually recompile the build and run tests.

### Testing
Impromptu uses [Mocha](http://visionmedia.github.com/mocha/) for testing. To run the test suite alone, run `grunt mocha`.


## License

Copyright (c) 2013 Daryl Koopersmith & Evan Solomon
Licensed under the MIT license.
