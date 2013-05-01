Modules are the way to expose shared, generically usable methods to Impromptu prompts.  Impromptu modules are just normal Node.js modules, plus some extra helpers to expose your commands to prompts.

## Exports

As with any Node module, you'll use Node's `module.exports` object to expose your code to the outside world. Impromptu will pass two arguments into your export, an object containing your module's methods, and the `Impromptu` global.

```coffeescript
module.exports = (myModule, Impromptu) ->
  # My module goes here
```

## Registering commands

Impromptu runs your module in the context of the current Impromptu instance, which lets us expose some helpers for you on the `this` keyword.  The one you'll use most is `register()`. The `this.register` method takes two arguments, a name (this is how your command will be accessed in prompt files) and a callback, which will run asyncronously when your command's value is ready.

It's important to know that *all* Impromptu commands are asynchronous. You shouldn't need to think about this too much if you don't want to, but there are a couple things it will mean you have to do differently in Impromptu modules than in "normal" JavaScript. Let's take an example from the Git module that tells you whether or not you're in a Git repository.

```coffeescript
repo = something()

module.exports = (myModule, Impromptu) ->
  @register 'isRepo', (done) ->
    done null, !! repo
```

There are two important things to notice here. First, the callback function takes an argument called `done`. This is itself a callback, which you're responsible for calling when your command's value is ready to be returned. If you don't call the `done()` callback, your command will never return and the prompt will never print. *Always* make sure to call `done()`.

The second thing to notice is that when `done()` is called we pass it two values. This follows the Node.js conversion of passing an error and then the results to callbacks, and that's exactly what we're doing here. The first argument (`null`) is treated as our errors. In this case, we happen to know that we don't have any errors because we're just returning the boolean version of a variabe that already exists. In later examples you'll see how real error objects can be passed around. The second argument (`!! repo`) is the "real" data, the thing that we want to make available to prompt files.

This is the pattern that *all* Impromptu commands must follow, so it will be valuable to make sense of how it works. Thinking asyncronously can be pretty tricky at times, but it's one of the ways we try to make Impromptu as fast as it can possibly be.

## Accessing your own commands

Often you'll want to access commands within your own module to avoid repetitive code. This is where the first argument to your module comes in. When you register a command it gets added to an object that Impromptu makes available to prompt files. You can use the same object to reference the commands you create. Here's another example from the Git module:

```coffeescript
module.exports = (myModule, Impromptu) ->
  @register '_status', (done) ->
    return done null, [] unless status = repo?.getStatus()

    statuses = for path, code of status
      # Hack around weird behavior in libgit2 that treats nested Git repos as submodules
      # https://github.com/libgit2/libgit2/pull/1423
      #
      # Benchmarking suggests this is likely fast enough
      continue if repo.isIgnored path

      path: path
      code: code
      staged: STATUS_CODE_MAP[code]?.staged
      desc: STATUS_CODE_MAP[code]?.desc

    done null, statuses

  @register 'untracked', (done) ->
    git._status, (err, statuses) ->
      statuses = _filter_statuses_by_desc(statuses, 'added')
      count = _.where(statuses, {staged: false}).length
      done err, count
```

Here we're generating a reusable array of data in `_status`, then using the array to generate more specifically-formatted data in `untracked`. Here, `git` is the name of our local copy of our methods object, which lets us reference and reuse those methods even though they weren't actually defined as methods in the module (they were passed as arguments to `this.register`).

## Using modules in prompts

Once you have a module, you'll probably want to use it in your prompt file. Prompt files, much like modules, are executed in a context that gives you access to some helpers. Once of them is `this.module.require`. It works a lot like Node's `require()` and sets up the Impromptu commands a module has registered to be used in a prompt.

```coffeescript
module.exports = (Impromptu, section) ->
  git = @module.require 'impromptu-git'
```

This loads the Impromptu Git module and sets its commands on the `git` local variable. Now I can use any of those commands in my prompt with Impromptu's [section API](https://github.com/Impromptu/impromptu/blob/master/docs/syntax.md). You should read the documentation for full details, but here is a quick example of using a module in a prompt:

```coffeescript
module.exports = (Impromptu, section) ->
  git = @module.require 'impromptu-git'

  section 'git:branch',
    content: [git.branch, git.isDetachedHead]
    when: git.isRepo
    format: (branch, detached) ->
      branch = "➦ #{branch}" if detached
      branch
    background: 'green'
    foreground: 'black'
```
