const { BigInteger } = require("jsbn");
const { hashes } = require("./hashes.js");
const arrayBufferToHex = require("array-buffer-to-hex");

const Message = require("@isomorphic-pgp/parser/Message.js");
const PublicKey = require("@isomorphic-pgp/parser/Packet/PublicKey.js");
const UrlSafeBase64 = require("@isomorphic-pgp/parser/UrlSafeBase64.js");
const EMSA = require("@isomorphic-pgp/parser/emsa.js");
const { HashAlgorithm } = require("@isomorphic-pgp/parser/constants.js");

const { certificationSignatureHashData } = require("@isomorphic-pgp/parser/certificationSignatureHashData.js");

module.exports.verifySelfSignature = async function verifySelfSignature(openpgpPublicKey) {
  let parsed = Message.parse(openpgpPublicKey);
  let publicKeyPacket = parsed.packets[0].packet;
  let userIdPacket = parsed.packets[1].packet;
  let selfSignaturePacket = parsed.packets[2].packet;

  const hashType = HashAlgorithm[selfSignaturePacket.hash]
  let buffer = await certificationSignatureHashData(publicKeyPacket, userIdPacket, selfSignaturePacket);
  let hash = await hashes[hashType](buffer, { outputFormat: "buffer" });
  hash = new Uint8Array(hash);

  let jwkPublicKey = PublicKey.toJWK(publicKeyPacket);

  let n = UrlSafeBase64.serialize(publicKeyPacket.mpi.n);

  // Wrap `hash` in the dumbass EMSA-PKCS1-v1_5 padded message format.
  hash = EMSA.encode(hashType, hash, n.length);

  let signature = UrlSafeBase64.serialize(selfSignaturePacket.mpi.signature);

  let S = new BigInteger(arrayBufferToHex(signature), 16);
  let N = new BigInteger(arrayBufferToHex(UrlSafeBase64.serialize(publicKeyPacket.mpi.n)), 16);
  let E = new BigInteger(arrayBufferToHex(UrlSafeBase64.serialize(publicKeyPacket.mpi.e)), 16);

  let M = S.modPow(E, N);
  let _hashbytes = M.toByteArray();
  _hashbytes.unshift(0);
  let _hash = new Uint8Array(_hashbytes);

  let valid = hash.every((byte, index) => byte === _hash[index]);
  return valid;
}
