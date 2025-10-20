module.exports.parse = function parse([b1, b2, b3, b4]) {
  return (b1 << 24) + (b2 << 16) + (b3 << 8) + b4;
}

module.exports.serialize = function serialize(n) {
  return [(n >> 24) & 255, (n >> 16) & 255, (n >> 8) & 255, n & 255];
}
