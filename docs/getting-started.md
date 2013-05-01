## Installation

Impromptu is written in Node.js, and that should be the only external dependency you need that we can't install for you. On OSX, the easiest way to get it is `brew install node`. Impromptu requires version 0.8 or higher.

Once you have Node installed, you can install Impromptu via NPM. Since Impromptu has to be available to generate your prompt everywhere, it needs to be installed globally. Make sure your node modules directory is accessable in your `PATH` then run:

`npm install -g impromptu`

Now you'll have access to the `impromptu` executable, but it won't do anything cool *yet*.


## Setting up your prompt

We have a starter prompt configuration that you can use and fork, you can find it over in the [My Impromptu](https://github.com/Impromptu/my-impromptu) repository. All Impromptu configuration goes in the `~/.impromptu` directory. To start with the My Impromptu prompt, run:

```
git clone git://github.com/Impromptu/my-impromptu.git ~/.impromptu
cd ~/.impromptu
npm install
```

You're free to use your own code and ignore our start repo, of course. If you do make your prompt a Git repo (you should!) we recommend you `gitignore` the `.compiled` directory, which we use to store your compiled prompt and possibly other files you should ignore.

Your actual prompt configuration goes in `~/.impromptu/prompt.coffee` or `~/.impromptu/prompt.js`. You're free to write in CoffeeScript or JavaScript, whether or not CoffeeScript is globally available. We'll take care of the rest and you won't incur any performance penalties because we cache the compiled JavaScript version of CoffeeScript prompts. In this documentation we'll always show CoffeeScript examples, but anything in your prompt can be written in CoffeeScript or JavaScript.

I've you've cloned the My Impromptu repository, Impromptu can actually generate a working prompt for you. Most shells use a variable called `$PS1` to store your prompt configuration. You just need to pass the `impromptu` executable to that variable to let Impromptu start generating your prompts. The variable usually lives in a file like `~/.profile`, `~/.bashrc`, `~/.zshrc`, or something similar, depending on your shell and operating system. To use Impromptu, set the variable like this (note that the quotes are important):

```shell
PS1='$(impromptu)'
```
