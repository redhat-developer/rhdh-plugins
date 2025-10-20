const concatenate = require("concat-buffers");
const { select } = require("select-case");
const { bits } = require("./bits.js");
const { PacketTag, OldPacketLengthType } = require("./constants.js");
const SignaturePacket = require("./Packet/Signature.js");
const PublicKeyPacket = require("./Packet/PublicKey.js");
const SecretKeyPacket = require("./Packet/SecretKey.js");
const UserIdPacket = require("./Packet/UserId.js");
const Uint16 = require("./Uint16.js");
const Uint32 = require("./Uint32.js");

function pickType(size) {
  if (size === undefined) return 3;
  if (size < 2 ** 8) return 0;
  if (size < 2 ** 16) return 1;
  if (size < 2 ** 32) return 2;
  throw new Error(`Packet size is too big for OldFormatPacket`);
}

module.exports.parse = function parse(a, packet) {
  let byte1 = a.b[a.i];
  packet.tag = (byte1 & (bits[5] + bits[4] + bits[3] + bits[2])) >> 2;
  packet.tag_s = PacketTag[packet.tag];
  packet.length = {};
  packet.length.type = byte1 & (bits[1] + bits[0]);
  packet.length.type_s = OldPacketLengthType[packet.length.type];
  // Skip over lengthType
  a.i++;

  // JavaScript's float64 numbers can safely store the largest uint32 value
  // so no need to use BigInts to store the result.
  // And since it uses uint32 for bitwise arithmetic, we can safely abuse
  // bit-shifting instead of multiplying as well.
  packet.length.value = select(packet.length.type, {
    0: () => a.b[a.i++],
    1: () => Uint16.parse([a.b[a.i++], a.b[a.i++]]),
    2: () => Uint32.parse([a.b[a.i++], a.b[a.i++], a.b[a.i++], a.b[a.i++]]),
    3: () => a.b.length - a.i
  });

  let _data = a.b.slice(a.i, (a.i += packet.length.value));

  packet.packet = select(packet.tag, {
    2: () => SignaturePacket.parse(_data),
    5: () => SecretKeyPacket.parse(_data),
    7: () => SecretKeyPacket.parse(_data),
    6: () => PublicKeyPacket.parse(_data),
    14: () => PublicKeyPacket.parse(_data),
    13: () => UserIdPacket.parse(_data),
    default: null
  });
  return packet;
}

module.exports.serialize = function serialize(packet) {
  const highbit = bits[7];
  const packetType = 0 << 6;
  const tag = (packet.tag << 2) & (bits[5] + bits[4] + bits[3] + bits[2]);

  let part3 = select(packet.tag, {
    2: () => SignaturePacket.serialize(packet.packet),
    5: () => SecretKeyPacket.serialize(packet.packet),
    7: () => SecretKeyPacket.serialize(packet.packet),
    6: () => PublicKeyPacket.serialize(packet.packet),
    14: () => PublicKeyPacket.serialize(packet.packet),
    13: () => UserIdPacket.serialize(packet.packet)
  });

  const length = part3.length;
  const lengthType = pickType(length) & (bits[1] + bits[0]);
  packet.length = {
    value: length,
    type: lengthType,
    type_s: OldPacketLengthType[lengthType]
  };

  // prettier-ignore
  let part1 = new Uint8Array([highbit + packetType + tag + lengthType]);
  let part2 = select(packet.length.type, {
    0: () => new Uint8Array([packet.length.value]),
    1: () => new Uint8Array([...Uint16.serialize(packet.length.value)]),
    2: () => new Uint8Array([...Uint32.serialize(packet.length.value)])
  });

  if (part3.length !== packet.length.value) throw new Error("Invalid length");

  return concatenate([part1, part2, part3]);
}
