[![Build Status](https://travis-ci.org/Impromptu/impromptu.png)](https://travis-ci.org/Impromptu/impromptu)

# Impromptu

A sentient prompt.


## Installation

Impromptu is written in Node.js, and that should be the only external dependency you need that we can't install for you. On OSX, the easiest way to get it is `brew install node`. Impromptu requires version 0.8 or higher.

Once you have Node installed, you can install Impromptu via NPM. Since Impromptu has to be available to generate your prompt everywhere, it needs to be installed globally. Run `npm install -g impromptu` and make sure your node modules directory is accessable in your `PATH`. Now you'll have access to the `impromptu` executable, but it won't do anything cool *yet*.


## Setting up your prompt

We have a starter prompt configuration that you can use and fork, you can find it over in the [My Impromptu](https://github.com/Impromptu/my-impromptu) repo. All Impromptu configuration goes in your home directory in the `~/.impromptu` directory. To start with the My Impromptu prompt, run `git clone git://github.com/Impromptu/my-impromptu.git ~/.impromptu`. You're free to use your code of course. If you do make your prompt a Git repo (you should!) we recommend you `gitignore` the `.compiled` directory, which we used to store your compiled prompt and possibly other files you should ignore.

Your actual prompt configuration goes in `~/.impromptu/prompt.coffee` or `~/.impromptu/prompt.js`. You're free to write in CoffeeScript or JavaScript, whether or not CoffeeScript is globally available. We'll take care of the rest and you won't incur any performance penalties because we cache the compiled JavaScript version of CoffeeScript prompts. In this documentation we'll always show CoffeeScript examples, but anything in your prompt can be written in CoffeeScript or JavaScript.

I've you've cloned the My Impromptu repository, Impromptu can actually generate a working prompt for you. Most shells use a variable called `$PS1` to store your prompt configuration. You just need to pass the `impromptu` executable to that variable to let Impromptu start generating your prompts. Te variable usually lives in a file like `~/.profile`, `~/.bashrc`, or something similar, depending on your shell and operating system. To use Impromptu, set the variable like this.

```shell
PS1='$(impromptu)'
```


## Syntax

Impromptu strives to have a simple, readable syntax. In designing it, we've tried to make prompt files look and feel as much like CSS (really more like SASS or LESS) as possible. Impromptu's basic assumption is that your prompt is comprised of sections, each showing an individual (but possibly related) piece of information. A very basic example would be a section showing your prompt's ending character, like a dollar sign. That would look like this.

```coffeescript
section 'end',
  content: '$'
```

That's the most basic implementation of Impromptu's section API. Sections take a name (`String`) and properties (`Object`). Let's break that all CoffeeScript rule just once and show what that would look like in JavaScript, just so everything is clear.

```javascript
section('end', {
  content: '$'
});
```

That's it. Hopefully you'll agree that's a lot nicer looking than the mess of code that usually ends up in your `.bashrc`. Of course, that is a **very** basic example and Impromptu can do a lot more than just print strings.


### Colors

One of Impromptu's design principles is that adding meaningful colors makes your prompt more powerful and easier to use. Impromptu has built in settings for foreground and background colors. Sadly, terminals don't provide a ton of color options, but we try to make the ones you have as easy to use as possible. Impromptu sections take optional `foreground` and `background` properties. Although they're optional, we strongly encourage you to use at least one of them in each section because they make your prompt awesome.

Let's say we wanted to make our prompt ending string white with a blue background. It would be as simple as.

```coffeescript
section 'end',
  content: '$'
  foreground: 'white'
  background: 'blue'
```

Impromptu comes with presets for 10 colors: black, red, green, yellow, blue, magenta, cyan, white and default.

### Content

Content is the thing that actually gets displayed in your prompt. As you've seen, it can be as simple as a string. It can also be a function. Let's say we wanted to show the current time in our prompt. It might look something like this.

```coffeescript
section 'time',
  content: ->
    date    = new Date
    hours   = if date.getHours() > 12 then date.getHours() - 12 else date.getHours()
    minutes = if date.getMinutes().length is 1 then "0#{date.getMinutes()}" else date.getMinutes()
    seconds = if date.getSeconds().length is 1 then "0#{date.getSeconds()}" else date.getSeconds()
    "#{hours}:#{minutes}:#{seconds}"
  foreground: 'white'
  background: 'blue'
```

The `content` parameter can also accept a reference to a function. In its simplest form, you could just define a function, give it a name, and pass the name to content.

```coffeescript
showFoo = -> 'foo'

section 'someFunction',
  content: showFoo
```

Another common pattern is to export functions from modules, and pass those functions to your prompt. We'll cover this more in the module section, but you can see a couple examples of this in the My Impromptu repository with the Git and system modules.

The last thing you should know about the `content` parameter is that it accepts arrays. If an array of content is passed in, by default impromptu will join the values when they're displayed. More likely, you'll want to process the values in a formatter.

### Formatters

The `format` parameter accepts a function, which can customize the way data is shown in a prompt section. A common usage is when you want to combine multiple data sources into a single section. There's a good example of this in the My Impromptu repository from the system module where we show the user's name and host in one section.

```coffeescript
section 'user',
  content: [system.user, system.shortHost]
  format: (user, host) ->
    "#{user}@#{host}"
  background: 'black'
````

Formatters can do more than just join strings together. In My Impromptu, we actually omit this section if you have an environment variable called `$DEFAULT_USER` that matches your current user. If the formatter (or the content) returns an empty value, Impromptu will automatically omit the section.

```coffeescript
section 'user',
  content: [system.user, system.shortHost]
  format: (user, host) ->
    return if user.trim() is process.env.DEFAULT_USER
    "#{user}@#{host}"
  background: 'black'
```

### When

The last property that the section command uses is `when`. When acts a bit like the early return we showed in `format`, but it lets you shortcut the process and avoid loading the content at all. Again, a good example of this property can be found in My Impromptu in its Git sections. In general, you don't want to do anything with Git unless you're in a Git repository. The Git module provides an `isRepo` command, which is useful in the `when` property. Here's an example that ties most of the uses we've covered so far together.

```coffeescript
  section 'git:branch',
    when: git.isRepo
    content: [git.branch, git.isDetachedHead]
    format: (branch, detached) ->
      branch = "➦ #{branch}" if detached
      branch
    background: 'green'
    foreground: 'black'
```

Now I'll take that same section and augment it with some comments to explain what's going on in each part.

```coffeescript
  # Make a new section, name it 'git:branch'
  section 'git:branch',
    # Only load this section when we're inside a Git repository
    # If we're not inside a Git repository, skip this entirely
    when: git.isRepo

    # Load two pieces of content: the branch name and whether or not we're in a
    # "detached head" state, which is Git's term for when we're not on a branch but
    # instead on a specific commit. The Git module will return a commit hash when we're
    # not on a branch. This second value lets us catch and format that case.
    content: [git.branch, git.isDetachedHead]

    # Define a format function that accepts both of the arguments we asked for in content.
    format: (branch, detached) ->
      # If we're in a detached head, prepend the commit hash with an arrow icon
      branch = "➦ #{branch}" if detached
      # Print the branch name or the array + commit hash
      branch

    # Make the section background green
    background: 'green'
    # ...and the section content black
    foreground: 'black'
```

## Modules


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
