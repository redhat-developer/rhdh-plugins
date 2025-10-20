const UrlSafeBase64 = require("../../UrlSafeBase64.js");
const arrayBufferToHex = require("array-buffer-to-hex");

module.exports.parse = function parse(data) {
  return {
    issuer: UrlSafeBase64.parse(data),
    issuer_s: arrayBufferToHex(data, "hex")
  };
}

module.exports.serialize = function serialize(subpacket) {
  return UrlSafeBase64.serialize(subpacket.issuer);
}
