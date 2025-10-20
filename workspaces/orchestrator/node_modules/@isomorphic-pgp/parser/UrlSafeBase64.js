const base64 = require("base64-js");

module.exports.parse = function parse(buffer) {
  let str = base64.fromByteArray(buffer);
  str = str
    .replace(/\//g, "_")
    .replace(/\+/g, "-")
    .replace(/=/g, "");
  return str;
}

module.exports.serialize = function serialize(base64ustr) {
  // Note: base64-js can interpret both normal base64 (/+=) and url-safe (_-)
  // so we don't need to convert it from the urlsafe to normal this time
  // BUT we do need to add padding for some reason.
  let modulo = base64ustr.length % 4;
  let padlength = modulo > 0 ? 4 - modulo : 0;
  let padding = "=".repeat(padlength);
  return base64.toByteArray(base64ustr + padding);
}
