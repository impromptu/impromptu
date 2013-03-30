Impromptu
=========

A sentient prompt.


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


Using Impromptu (A Spec)
------------------------

```shell
# Reset the prompt cache
tu prompt reset

# Add a section, set some colors, set the priority.
tu section set user $(whoami)
tu section priority user 100
tu section background user blue
tu section foreground user white

# Or, do it all in one command.
tu section set pwd $(pwd) -p 50 -b blue -f black

# Build the prompt
tu prompt build
```


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
