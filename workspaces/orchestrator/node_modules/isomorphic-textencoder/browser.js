// Polyfill TextEncoder for MS Edge
require('fast-text-encoding')

module.exports = {
  encode: string => new TextEncoder().encode(string),
  decode: buffer => new TextDecoder().decode(buffer)
};
