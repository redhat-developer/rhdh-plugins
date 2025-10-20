const crc24 = require("crc/lib/crc24");
const base64 = require("base64-js");

module.exports.parse = function parse(str) {
  let matches;
  matches = str.match(/-----BEGIN (.*)-----/);
  if (matches === null) throw new Error("Unable to find an OpenPGP Armor Header Line");
  let type = matches[1];
  matches = str.match(/\r?\n\r?\n([\S\s]*)\r?\n=/);
  if (matches === null) throw new Error("Unable to find main body of OpenPGP ASCII Armor");
  let text = matches[1].replace(/\r/g, "").replace(/\n/g, "");
  let data = base64.toByteArray(text);
  return { type, data };
}

module.exports.serialize = function serialize({ type, data }) {
  let rawCRC = crc24(data);
  let crcBytes = new Uint8Array([(rawCRC >> 16) & 255, (rawCRC >> 8) & 255, rawCRC & 255]);
  let crcBase64 = base64.fromByteArray(crcBytes);
  let text = base64.fromByteArray(data);
  // Wrap every 64 characters
  let matches = text.match(/(.{1,64})/g);
  return `-----BEGIN ${type}-----

${matches.join("\n")}
=${crcBase64}
-----END ${type}-----`;
}
