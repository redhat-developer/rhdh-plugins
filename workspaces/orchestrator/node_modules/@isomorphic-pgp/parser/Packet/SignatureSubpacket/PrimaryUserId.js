module.exports.parse = function parse(data) {
  return {
    primaryUserId: true
  };
}

module.exports.serialize = function serialize(subpacket) {
  let f = subpacket.flags;
  return new Uint8Array([f & 255]);
}
