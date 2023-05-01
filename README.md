⚠️ WARNING: DO NOT USE ⚠️
Very Very Alpha State
=================

oclif example Hello World CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![Downloads/week](https://img.shields.io/npm/dw/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![License](https://img.shields.io/npm/l/oclif-hello-world.svg)](https://github.com/oclif/hello-world/blob/main/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g directus-template-util
$ directus-template-util COMMAND
running command...
$ directus-template-util (--version)
directus-template-util/0.0.0 darwin-x64 node-v18.12.1
$ directus-template-util --help [COMMAND]
USAGE
  $ directus-template-util COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`directus-template-util hello PERSON`](#directus-template-util-hello-person)
* [`directus-template-util hello world`](#directus-template-util-hello-world)
* [`directus-template-util help [COMMANDS]`](#directus-template-util-help-commands)
* [`directus-template-util plugins`](#directus-template-util-plugins)
* [`directus-template-util plugins:install PLUGIN...`](#directus-template-util-pluginsinstall-plugin)
* [`directus-template-util plugins:inspect PLUGIN...`](#directus-template-util-pluginsinspect-plugin)
* [`directus-template-util plugins:install PLUGIN...`](#directus-template-util-pluginsinstall-plugin-1)
* [`directus-template-util plugins:link PLUGIN`](#directus-template-util-pluginslink-plugin)
* [`directus-template-util plugins:uninstall PLUGIN...`](#directus-template-util-pluginsuninstall-plugin)
* [`directus-template-util plugins:uninstall PLUGIN...`](#directus-template-util-pluginsuninstall-plugin-1)
* [`directus-template-util plugins:uninstall PLUGIN...`](#directus-template-util-pluginsuninstall-plugin-2)
* [`directus-template-util plugins update`](#directus-template-util-plugins-update)

## `directus-template-util hello PERSON`

Say hello

```
USAGE
  $ directus-template-util hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ oex hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [dist/commands/hello/index.ts](https://github.com/bryantgillespie/directus-template-util/blob/v0.0.0/dist/commands/hello/index.ts)_

## `directus-template-util hello world`

Say hello world

```
USAGE
  $ directus-template-util hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ directus-template-util hello world
  hello world! (./src/commands/hello/world.ts)
```

## `directus-template-util help [COMMANDS]`

Display help for directus-template-util.

```
USAGE
  $ directus-template-util help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for directus-template-util.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.9/src/commands/help.ts)_

## `directus-template-util plugins`

List installed plugins.

```
USAGE
  $ directus-template-util plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ directus-template-util plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.4.6/src/commands/plugins/index.ts)_

## `directus-template-util plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ directus-template-util plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ directus-template-util plugins add

EXAMPLES
  $ directus-template-util plugins:install myplugin

  $ directus-template-util plugins:install https://github.com/someuser/someplugin

  $ directus-template-util plugins:install someuser/someplugin
```

## `directus-template-util plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ directus-template-util plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ directus-template-util plugins:inspect myplugin
```

## `directus-template-util plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ directus-template-util plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ directus-template-util plugins add

EXAMPLES
  $ directus-template-util plugins:install myplugin

  $ directus-template-util plugins:install https://github.com/someuser/someplugin

  $ directus-template-util plugins:install someuser/someplugin
```

## `directus-template-util plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ directus-template-util plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ directus-template-util plugins:link myplugin
```

## `directus-template-util plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ directus-template-util plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ directus-template-util plugins unlink
  $ directus-template-util plugins remove
```

## `directus-template-util plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ directus-template-util plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ directus-template-util plugins unlink
  $ directus-template-util plugins remove
```

## `directus-template-util plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ directus-template-util plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ directus-template-util plugins unlink
  $ directus-template-util plugins remove
```

## `directus-template-util plugins update`

Update installed plugins.

```
USAGE
  $ directus-template-util plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```
<!-- commandsstop -->
