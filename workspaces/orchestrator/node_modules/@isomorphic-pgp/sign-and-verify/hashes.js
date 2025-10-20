const { sha1, sha256, sha384, sha512 } = require('@wmhilton/crypto-hash')
const Hash = require('sha.js/sha1')

module.exports.hashes = {
  SHA1: async (buffer, options) => {
    let result
    try {
      result = await sha1(buffer, options)
    } catch (err) {
      // IE fallback
      result = new Hash().update(buffer).digest()
    }
    return result
  },
  SHA256: sha256,
  SHA384: sha384,
  SHA512: sha512
}
