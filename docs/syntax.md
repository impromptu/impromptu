## Syntax

Impromptu strives to have a simple, readable syntax. In designing it, we've tried to make prompt files look and feel as much like CSS (really more like SASS or LESS) as possible. Impromptu's basic assumption is that your prompt is comprised of sections, each showing an individual (but possibly related) piece of information. A very basic example would be a section showing your prompt's ending character, like a dollar sign. That would look like this.

```coffeescript
section 'end',
  content: '$'
```

That's the most basic implementation of Impromptu's section API. Sections take a name (`String`) and properties (`Object`). Let's break that all CoffeeScript rule just once and show what that would look like in JavaScript so everything is clear.

```javascript
section('end', {
  content: '$'
});
```

That's it. Hopefully you'll agree that's a lot nicer looking than the mess of code that usually ends up in your `.bashrc`. Of course, that is a **very** basic example and Impromptu can do a lot more than just print static strings.


### Names

The first argument to `section()` is a name. See My Impromptu's prompt file for some good exampe names. The name can really be anything you want, and it has two purposes:

1. It helps keep your prompt file organized. When you want to edit or remove sections, it's convenient to have a readable name and not have to parse all the code that you might have forgotten or not even written in the first place.
2. It allows you to access sections later. If you call `section()` with the same name as a previously defined section, Impromptu will let you edit the previous definition. This can come in handy.


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
    minutes = if date.getMinutes().toString().length is 1 then "0#{date.getMinutes()}" else date.getMinutes()
    seconds = if date.getSeconds().toString().length is 1 then "0#{date.getSeconds()}" else date.getSeconds()
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

A more useful pattern is often to export functions from modules, and pass those functions to your prompt. We'll cover this more in the module documentation, but you can see a couple examples of this in the My Impromptu repository with the Git and system modules.

The last thing you should know about the `content` parameter is that it accepts arrays. If an array of content is passed in, by default impromptu will join the values when they're displayed. More likely, you'll want to process the values in a formatter.


### Formatters

The `format` parameter accepts a function, which can customize the way data is shown in a prompt section. A common usage is when you want to combine multiple data sources into a single section. There's a good example of this in the My Impromptu repository from the system module where we show the user's name and host in one section, joined by an "@" symbol.

```coffeescript
section 'user',
  content: [system.user, system.shortHost]
  format: (user, host) ->
    "#{user}@#{host}"
  background: 'black'
````

Formatters can do more than just join strings together. In My Impromptu, we actually omit this section if you have an environment variable called `$DEFAULT_USER` that matches your current user. If the formatter (or the content) returns an empty value (anything whose `toString()` evaluates to an empty string), Impromptu will automatically omit the section.

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
    if detached then "➦ #{branch}" else branch
  background: 'green'
  foreground: 'black'
```

Now I'll take that same section and augment it with some comments to explain what's going on in each part.

```coffeescript
# Make a new section, name it 'git:branch'
# This naming style is helping for identifying the category (git) and the
# specific data being displayed (branch)
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
    # Otherwise just show the branch name normally
    if detached then "➦ #{branch}" else branch

  # Make the section background green
  background: 'green'

  # ...and the section content black
  foreground: 'black'
```
