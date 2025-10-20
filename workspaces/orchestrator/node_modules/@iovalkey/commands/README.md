# Valkey Commands

This module exports all the commands that Valkey supports.

This module was forked from [`@ioredis/commands`](https://github.com/ioredis/commands) at commit 4321d5d40473c48fadf49fd99662032eac9b855b

## Install

```shell
$ npm install @iovalkey/commands
```

## Usage

```js
const commands = require('@iovalkey/commands');
```

`.list` is an array contains all the lowercased commands:

```js
commands.list.forEach((command) => {
  console.log(command);
});
```

`.exists()` is used to check if the command exists:

```js
commands.exists('set') // true
commands.exists('other-command') // false
```

`.hasFlag()` is used to check if the command has the flag:

```js
commands.hasFlag('set', 'readonly') // false
```

`.getKeyIndexes()` is used to get the indexes of keys in the command arguments:

```js
commands.getKeyIndexes('set', ['key', 'value']) // [0]
commands.getKeyIndexes('mget', ['key1', 'key2']) // [0, 1]
```

## License

MIT
