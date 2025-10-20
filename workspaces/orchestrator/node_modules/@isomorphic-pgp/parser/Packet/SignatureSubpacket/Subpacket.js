const concatenate = require("concat-buffers");
const { select } = require("select-case");

const UrlSafeBase64 = require("../../UrlSafeBase64.js");
const Length = require("./Length.js");
const CreationTime = require("./CreationTime.js");
const Issuer = require("./Issuer.js");
const KeyFlags = require("./KeyFlags.js");

module.exports.parse = function parse(a) {
  let subpacket = {
    length: Length.parse(a),
    type: a.b[a.i++]
  };

  let _data = a.b.slice(a.i, (a.i += subpacket.length - 1));
  subpacket.subpacket = select(subpacket.type, {
    2: () => CreationTime.parse(_data),
    16: () => Issuer.parse(_data),
    27: () => KeyFlags.parse(_data),
    default: () => ({ data: UrlSafeBase64.parse(_data) })
  });
  return subpacket;
}

module.exports.serialize = function serialize(subpacket) {
  let content = select(subpacket.type, {
    2: () => CreationTime.serialize(subpacket.subpacket),
    16: () => Issuer.serialize(subpacket.subpacket),
    27: () => KeyFlags.serialize(subpacket.subpacket),
    default: () => UrlSafeBase64.serialize(subpacket.subpacket.data)
  });
  let length = Length.serialize(content.length + 1);
  return concatenate([length, new Uint8Array([subpacket.type]), content]);
}
