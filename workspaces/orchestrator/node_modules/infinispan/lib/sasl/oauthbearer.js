(function (root, factory) {
  if (typeof exports === 'object') {
    // CommonJS
    factory(exports, module);
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(['exports', 'module'], factory);
  }
}(this, function (exports, module) {

  /**
   * OAUTHBEARER `Mechanism` constructor.
   *
   * This class implements the OAUTHBEARER SASL mechanism.
   *
   * The OAUTHBEARER SASL mechanism provides support for exchanging a token obtained via OAuth with the server.
   *
   * References:
   *  - [RFC 4616](http://tools.ietf.org/html/rfc4616)
   *
   * @api public
   */
  function Mechanism() {
  }

  Mechanism.prototype.name = 'OAUTHBEARER';
  Mechanism.prototype.clientFirst = true;

  /**
   * Encode a response using given credential.
   *
   * Options:
   *  - `token`     an OAuth token
   *  - `authzid`   authorization identity (optional)
   *
   * @param {Object} cred
   * @api public
   */
  Mechanism.prototype.response = function (cred) {
    var str = 'n,';
    if (cred.authzid) {
      str += 'a=' + cred.authzid;
    }
    str += ',%x01,auth=Bearer ';
    str += cred.token;
    str += '%x01';
    return str;
  };

  /**
   * Decode a challenge issued by the server.
   *
   * @param {String} chal
   * @return {Mechanism} for chaining
   * @api public
   */
  Mechanism.prototype.challenge = function (chal) {
    return this;
  };

  exports = module.exports = Mechanism;

}));
