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
$ npm install -g directus-template-cli
$ directus-template-cli COMMAND
running command...
$ directus-template-cli (--version)
directus-template-cli/0.1.2 darwin-x64 node-v18.12.1
$ directus-template-cli --help [COMMAND]
USAGE
  $ directus-template-cli COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`directus-template-cli apply`](#directus-template-cli-apply)
* [`directus-template-cli help [COMMANDS]`](#directus-template-cli-help-commands)
* [`directus-template-cli plugins`](#directus-template-cli-plugins)
* [`directus-template-cli plugins:install PLUGIN...`](#directus-template-cli-pluginsinstall-plugin)
* [`directus-template-cli plugins:inspect PLUGIN...`](#directus-template-cli-pluginsinspect-plugin)
* [`directus-template-cli plugins:install PLUGIN...`](#directus-template-cli-pluginsinstall-plugin-1)
* [`directus-template-cli plugins:link PLUGIN`](#directus-template-cli-pluginslink-plugin)
* [`directus-template-cli plugins:uninstall PLUGIN...`](#directus-template-cli-pluginsuninstall-plugin)
* [`directus-template-cli plugins:uninstall PLUGIN...`](#directus-template-cli-pluginsuninstall-plugin-1)
* [`directus-template-cli plugins:uninstall PLUGIN...`](#directus-template-cli-pluginsuninstall-plugin-2)
* [`directus-template-cli plugins update`](#directus-template-cli-plugins-update)

## `directus-template-cli apply`

Apply a template to a blank Directus instance.

```
USAGE
  $ directus-template-cli apply

DESCRIPTION
  Apply a template to a blank Directus instance.

EXAMPLES
  $ directus-template-cli apply
```

_See code: [dist/commands/apply.ts](https://github.com/bryantgillespie/directus-template-cli/blob/v0.1.2/dist/commands/apply.ts)_

## `directus-template-cli help [COMMANDS]`

Display help for directus-template-cli.

```
USAGE
  $ directus-template-cli help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for directus-template-cli.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.9/src/commands/help.ts)_

## `directus-template-cli plugins`

List installed plugins.

```
USAGE
  $ directus-template-cli plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ directus-template-cli plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.4.7/src/commands/plugins/index.ts)_

## `directus-template-cli plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ directus-template-cli plugins:install PLUGIN...

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
  $ directus-template-cli plugins add

EXAMPLES
  $ directus-template-cli plugins:install myplugin 

  $ directus-template-cli plugins:install https://github.com/someuser/someplugin

  $ directus-template-cli plugins:install someuser/someplugin
```

## `directus-template-cli plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ directus-template-cli plugins:inspect PLUGIN...

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
  $ directus-template-cli plugins:inspect myplugin
```

## `directus-template-cli plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ directus-template-cli plugins:install PLUGIN...

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
  $ directus-template-cli plugins add

EXAMPLES
  $ directus-template-cli plugins:install myplugin 

  $ directus-template-cli plugins:install https://github.com/someuser/someplugin

  $ directus-template-cli plugins:install someuser/someplugin
```

## `directus-template-cli plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ directus-template-cli plugins:link PLUGIN

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
  $ directus-template-cli plugins:link myplugin
```

## `directus-template-cli plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ directus-template-cli plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ directus-template-cli plugins unlink
  $ directus-template-cli plugins remove
```

## `directus-template-cli plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ directus-template-cli plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ directus-template-cli plugins unlink
  $ directus-template-cli plugins remove
```

## `directus-template-cli plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ directus-template-cli plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ directus-template-cli plugins unlink
  $ directus-template-cli plugins remove
```

## `directus-template-cli plugins update`

Update installed plugins.

```
USAGE
  $ directus-template-cli plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```
<!-- commandsstop -->
