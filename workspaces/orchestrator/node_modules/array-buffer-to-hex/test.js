var arrayBufferToHex = require('./')
var assert = require('assert')

var expected = '8c825d0c40d87ffa'
var input = new Uint8Array([0x8c, 0x82, 0x5d, 0x0c, 0x40, 0xd8, 0x7f, 0xfa])

assert.strictEqual(arrayBufferToHex(input.buffer), expected)
