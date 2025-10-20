## concat-buffers

Concatenate Uint8Arrays

[![Build Status](https://travis-ci.org/iefserge/concat-buffers.svg)](https://travis-ci.org/iefserge/concat-buffers)

## USAGE

```js
var concatBuffers = require('concat-buffers');

concatBuffers(new Uint8Array([1, 2]), new Uint8Array([3, 4, 5]));
// Uint8Array [1, 2, 3, 4, 5]

concatBuffers([new Uint8Array([1]), new Uint8Array([2])]);
// Uint8Array [1, 2]
```

##LICENSE

MIT
