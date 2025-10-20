const PublicKey = require("@isomorphic-pgp/parser/Packet/PublicKey.js");
const Hash = require("sha.js/sha1");

module.exports.fingerprint = async function fingerprint(packet) {
  let buffer = await PublicKey.serializeForHash(packet);
  let hash = new Hash().update(buffer).digest();
  return new Uint8Array(hash);
}
