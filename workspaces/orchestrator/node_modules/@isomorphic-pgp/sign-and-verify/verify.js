const { BigInteger } = require("jsbn");
const { hashes } = require("./hashes.js");
const arrayBufferToHex = require("array-buffer-to-hex");
const { encode } = require("isomorphic-textencoder");

const Message = require("@isomorphic-pgp/parser/Message.js");
const UrlSafeBase64 = require("@isomorphic-pgp/parser/UrlSafeBase64.js");
const EMSA = require("@isomorphic-pgp/parser/emsa.js");
const { HashAlgorithm } = require("@isomorphic-pgp/parser/constants.js");
const { payloadSignatureHashData } = require("@isomorphic-pgp/parser/payloadSignatureHashData.js");

const { trimZeros } = require("@isomorphic-pgp/util/trimZeros.js");

module.exports.verify = async function verify(openpgpPublicKey, openpgpSignature, payload) {
  let parsedPublicKey = Message.parse(openpgpPublicKey);
  let publicKeyPacket = parsedPublicKey.packets[0].packet;
  let userIdPacket = parsedPublicKey.packets[1].packet;
  let selfSignaturePacket = parsedPublicKey.packets[2].packet;

  let n = UrlSafeBase64.serialize(publicKeyPacket.mpi.n);
  let e = UrlSafeBase64.serialize(publicKeyPacket.mpi.e);

  let parsedSignature = Message.parse(openpgpSignature);
  let signaturePacket = parsedSignature.packets[0].packet;

  let signature = UrlSafeBase64.serialize(signaturePacket.mpi.signature);

  const hashType = HashAlgorithm[signaturePacket.hash]
  payload = typeof payload === "string" ? encode(payload) : payload;
  let buffer = await payloadSignatureHashData(payload, signaturePacket);
  let hash = await hashes[hashType](buffer, { outputFormat: "buffer" });
  hash = new Uint8Array(hash);
  let left16 = (hash[0] << 8) + hash[1];
  if (left16 !== signaturePacket.left16) {
    throw new Error("Signature failed left16 hash check");
  }

  // Wrap `hash` in the dumbass EMSA-PKCS1-v1_5 padded message format:
  hash = EMSA.encode(hashType, hash, n.byteLength);

  let S = new BigInteger(arrayBufferToHex(signature), 16);
  let N = new BigInteger(arrayBufferToHex(n), 16);
  let E = new BigInteger(arrayBufferToHex(e), 16);

  let M = S.modPow(E, N);
  let _hashbytes = M.toByteArray();
  let _hash = new Uint8Array(_hashbytes);
  _hash = trimZeros(_hash);

  let valid = hash.every((byte, index) => byte === _hash[index]);
  return valid;
}
