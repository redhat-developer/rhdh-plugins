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
   * EXTERNAL `Mechanism` constructor.
   *
   * This class implements the EXTERNAL SASL mechanism.
   *
   * The EXTERNAL SASL mechanism provides support for authentication using
   * credentials established by external means. 
   *
   * References:
   *  - [RFC 4422](http://tools.ietf.org/html/rfc4422)
   *
   * @api public
   */
  function Mechanism() {
  }

  Mechanism.prototype.name = 'EXTERNAL';
  Mechanism.prototype.clientFirst = true;

  /**
   * Encode a response using given credential.
   *
   * Options:
   *  - `authzid`   authorization identity (optional)
   *
   * @param {Object} cred
   * @api public
   */
  Mechanism.prototype.response = function (cred) {
    return cred.authzid || '';
  };

  /**
   * Decode a challenge issued by the server.
   *
   * @param {String} chal
   * @api public
   */
  Mechanism.prototype.challenge = function (chal) {
  };

  exports = module.exports = Mechanism;

}));
