# array-buffer-to-hex

Turn an `ArrayBuffer` into a string of hexadecimal characters.

## Installation

```sh
npm install --save array-buffer-to-hex
```

## Usage

```js
const arrayBufferToHex = require('array-buffer-to-hex')

const randomData = crypto.getRandomValues(new Uint8Array(16)).buffer

const string = arrayBufferToHex(randomData)

console.log(string)
//=> "a2c57b9bc22056336ce5a3ec917819e0"
```

## API

### arrayBufferToHex(arrayBuffer: ArrayBuffer) => string

Returns a new string with the hexadecimal content from the array buffer.
