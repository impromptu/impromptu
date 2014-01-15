[![Build Status](https://travis-ci.org/Impromptu/impromptu.png)](https://travis-ci.org/Impromptu/impromptu)

Impromptu
=========

A better prompt.

Installation
------------
Impromptu requires [Node.js](http://nodejs.org/). The install script currently requires [Git](http://git-scm.com/). Impromptu supports bash and zsh by default.

1. `npm install -g use-impromptu`

2. Run `which impromptu`. If there's no output, npm's global scripts are not available in your `$PATH`. You'll need to add something like `export PATH=$PATH:/usr/local/share/npm/bin` to your shell’s configuration file.

3. Add `source impromptu` to the end of your shell’s configuration file. You might want to run something like `echo 'source impromptu' >> ~/.bash_profile` on a default OS X install.


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


License
-------
Copyright (c) 2013 Daryl Koopersmith & Evan Solomon
Licensed under the MIT license.
