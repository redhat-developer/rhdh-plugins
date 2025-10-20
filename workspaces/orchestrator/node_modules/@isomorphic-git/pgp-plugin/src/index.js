const ipgp = require('@isomorphic-pgp/sign-and-verify')
const { keyId } = require('@isomorphic-pgp/util/keyId')

module.exports.pgp = {
  async sign ({ payload, secretKey, timestamp = Math.floor(Date.now() / 1000) }) {
    let signature = await ipgp.sign(secretKey, payload, timestamp)
    return { signature }
  },
  async verify ({ payload, publicKey, signature }) {
    let sigValid = await ipgp.verify(publicKey, signature, payload)
    let invalid = []
    let valid = []
    let keyid = await keyId(publicKey)
    ;(sigValid ? valid : invalid).push(keyid)
    return { valid, invalid }
  }
}
