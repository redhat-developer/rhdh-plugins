const concatenate = require("concat-buffers");
const { encode, decode } = require("isomorphic-textencoder");

const Uint32 = require("../Uint32.js");

module.exports.parse = function parse(buffer) {
  return {
    userid: decode(buffer)
  };
}

module.exports.serialize = function serialize(packet) {
  return encode(packet.userid);
}

module.exports.serializeForHash = function serializeForHash(packet) {
  let buffer = module.exports.serialize(packet);
  return concatenate([new Uint8Array([0xb4, ...Uint32.serialize(buffer.length)]), buffer]);
}
