const concatenate = require("concat-buffers");
const Signature = require("./Packet/Signature.js");
const PublicKey = require("./Packet/PublicKey.js");
const UserId = require("./Packet/UserId.js");

module.exports.certificationSignatureHashData = async function certificationSignatureHashData(publicKeyPacket, userIdPacket, signaturePacket) {
  let pubkeyBuffer = PublicKey.serializeForHash(publicKeyPacket);
  let useridBuffer = UserId.serializeForHash(userIdPacket);
  let trailer = Signature.serializeForHashTrailer(signaturePacket);
  return concatenate([pubkeyBuffer, useridBuffer, trailer]);
}
