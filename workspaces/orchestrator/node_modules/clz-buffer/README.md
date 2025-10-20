# `clz-buffer`

[![Build Status](https://travis-ci.org/emilbayes/clz-buffer.svg?branch=master)](https://travis-ci.org/emilbayes/clz-buffer)

> Count leading zeros in a Buffer (clz)

## Usage

```js
var clz = require('clz-buffer')

clz([0b00001000]) // === 4
clz([0b10000000]) // === 0
clz([0b10000000, 0]) // === 0
clz([0, 0]) // === 16
clz(Buffer.from([0, 0, 0])) // === 24
```

## API

### `var n = clz(buf)`

Counts the number of leading zeros. Stops at the first 1-bit. Works for any
array-like type with values in the domain `[0, 255]`.

## Install

```sh
npm install clz-buffer
```

## License

[ISC](LICENSE)
