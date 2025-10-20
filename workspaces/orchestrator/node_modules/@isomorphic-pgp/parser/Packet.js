const { bits } = require("./bits.js");
const OldFormatPacket = require("./OldFormatPacket.js");
const { PacketType } = require("./constants.js");

module.exports.parse = function parse(a) {
  let packet = {};
  let byte1 = a.b[a.i];
  let _bit7_unused = byte1 & bits[7];
  if (_bit7_unused === 0) {
    throw new Error("Expected bit 7 to be high. Possibly unknown OpenPGP packet format");
  }
  packet.type = byte1 & bits[6];
  packet.type_s = PacketType[packet.type];
  switch (packet.type) {
    case 0: {
      OldFormatPacket.parse(a, packet);
      break;
    }
    case 1: {
      throw new Error("New packets not supported yet");
    }
  }
  return packet;
}

module.exports.serialize = function serialize(packet) {
  switch (packet.type) {
    case 0: {
      return OldFormatPacket.serialize(packet);
    }
    case 1: {
      throw new Error("New packets are not supported yet");
    }
  }
}
