[![Build Status](https://travis-ci.org/Impromptu/impromptu.png)](https://travis-ci.org/Impromptu/impromptu)

Impromptu
=========

A better prompt.

Installation
------------
Impromptu requires [Node.js](http://nodejs.org/) and [Redis](http://redis.io/). The install script currently requires [Git](http://git-scm.com/). Impromptu supports bash and zsh by default.

1. `npm install -g use-impromptu`
2. Add `source impromptu` to the end of your shell’s configuration file. You might want to run something like `echo 'source impromptu' >> ~/.bash_profile` on a default OS X install.


Philosophy
----------

### On Prompts
* Prompts should be aware of the internet, and able to show relevant information from it.
* Prompts should show relevant information when you need it, and nothing else.
* Prompts should use colors so that they're visually easy to parse.
* Prompts should be prompt. Performance is paramount.

### On Impromptu
* Impromptu should be self-documenting.
* Impromptu should be easily extensible.


Development
-----------

Impromptu uses [Grunt](http://gruntjs.com/).

### Install
After checking out Impromptu, run `npm install` in the `impromptu` directory.

If you don't have the [grunt-cli](https://github.com/gruntjs/grunt-cli) package installed globally, run `npm install -g grunt-cli`.

### Development
In the `impromptu` directory, run `grunt` to build and test Impromptu.

Run `grunt watch` to continually recompile the build and run tests.

### Testing
Impromptu uses [Mocha](http://visionmedia.github.com/mocha/) for testing. To run the test suite alone, run `grunt mocha`.


License
-------
Copyright (c) 2013 Daryl Koopersmith & Evan Solomon
Licensed under the MIT license.
