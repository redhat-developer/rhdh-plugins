
# is-native-module

Check if a node module contains native code.

## Usage

```js
const isNative = require('is-native-module')

const pkg = require('./package.json')
console.log(isNative(pkg))
```

```bash
$ cd module/
$ is-native-module
$ echo $?
0 # native module
```

## Installation

```bash
$ npm install [-g] is-native-module
```

## API

### isNative(pkg)

## License

MIT
