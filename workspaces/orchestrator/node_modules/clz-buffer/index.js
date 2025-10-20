module.exports = function clzbufferBE(buf) {
  var nlz = 0

  for (var i = 0; i < buf.length; i++, nlz += 8) {
    if (buf[i] === 0) continue

    nlz += Math.clz32(buf[i]) - 24
    break
  }

  return nlz
}
