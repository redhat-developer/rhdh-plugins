const Uint32 = require("../../Uint32.js");

module.exports.parse = function parse(data) {
  return {
    creation: Uint32.parse(data)
  };
}

module.exports.serialize = function serialize(subpacket) {
  return new Uint8Array(Uint32.serialize(subpacket.creation));
}
