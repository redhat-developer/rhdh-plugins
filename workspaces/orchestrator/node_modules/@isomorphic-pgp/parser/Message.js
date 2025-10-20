const AsciiArmor = require("./AsciiArmor.js");
const PacketArray = require("./PacketArray.js");

module.exports.parse = function parse(input) {
  let { type, data } = AsciiArmor.parse(input);
  return {
    type,
    packets: PacketArray.parse(data)
  };
}

module.exports.serialize = function serialize(input) {
  let { type, packets } = input;
  let data = PacketArray.serialize(packets);
  return AsciiArmor.serialize({ type, data });
}
