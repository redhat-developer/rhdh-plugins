const concatenate = require("concat-buffers");
const Signature = require("./Packet/Signature.js");

module.exports.payloadSignatureHashData = async function payloadSignatureHashData(payload, signaturePacket) {
  let trailer = Signature.serializeForHashTrailer(signaturePacket);
  return concatenate([payload, trailer]);
}
