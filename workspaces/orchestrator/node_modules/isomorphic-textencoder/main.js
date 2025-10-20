module.exports = {
  encode: string => new Uint8Array(Buffer.from(string, "utf8")),
  decode: buffer => Buffer.from(buffer).toString("utf8")
};
