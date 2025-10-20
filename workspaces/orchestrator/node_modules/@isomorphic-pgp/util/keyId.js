const arrayBufferToHex = require("array-buffer-to-hex");
const Message = require("@isomorphic-pgp/parser/Message.js");
const { fingerprint } = require("./fingerprint.js");

module.exports.keyId = async function keyId(openpgptext) {
  let message = Message.parse(openpgptext);
  let publicKeyPacket = message.packets[0].packet;
  let keyid = (await fingerprint(publicKeyPacket)).slice(12);
  return arrayBufferToHex(keyid);
}
