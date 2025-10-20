module.exports.parse = function parse([b1, b2]) {
  return (b1 << 8) + b2;
}

module.exports.serialize = function serialize(n) {
  return [(n >> 8) & 255, n & 255];
}
