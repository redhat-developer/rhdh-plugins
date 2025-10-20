(function (root, factory) {
    if (typeof exports === 'object') {
        // CommonJS
        factory(exports, module, require('crypto'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define(['exports', 'module', 'crypto'], factory);
    }
}(this, function (exports, module, crypto) {

    /**
     * DIGEST `Mechanism` constructor.
     *
     * This class implements the DIGEST-* SASL mechanism.
     *
     * References:
     *  - [RFC 2831](http://tools.ietf.org/html/rfc2831)
     *
     * @api public
     */
    function Mechanism(options) {
        options = options || {};
        this._genNonce = options.genNonce || genNonce(32);
    }

    Mechanism.prototype.name = 'DIGEST';
    Mechanism.prototype.clientFirst = false;

    /**
     * Encode a response using given credential.
     *
     * Options:
     *  - `username`
     *  - `password`
     *  - `host`
     *  - `serviceType`
     *  - `authzid`   authorization identity (optional)
     *
     * @param {Object} cred
     * @api public
     */
    Mechanism.prototype.response = function (cred) {
        // TODO: Implement support for subsequent authentication.  This requires
        //       that the client be able to store username, realm, nonce,
        //       nonce-count, cnonce, and qop values from prior authentication.
        //       The impact of this requirement needs to be investigated.
        //
        //       See RFC 2831 (Section 2.2) for further details.

        // TODO: Implement support for auth-int and auth-conf, as defined in RFC
        //       2831 sections 2.3 Integrity Protection and 2.4 Confidentiality
        //       Protection, respectively.
        //
        //       Note that supporting this functionality has implications
        //       regarding the negotiation of security layers via SASL.  Due to
        //       the fact that TLS has largely superseded this functionality,
        //       implementing it is a low priority.

        var uri = cred.serviceType + '/' + cred.host;
        if (cred.serviceName && cred.host !== cred.serviceName) {
            uri += '/' + serviceName;
        }
        var realm = cred.realm || this._realm || ''
            , cnonce = this._genNonce()
            , nc = '00000001'
            , qop = 'auth'
            , ha1
            , ha2
            , digest;
        var str = '';
        str += 'username="' + cred.username + '"';
        if (realm) { str += ',realm="' + realm + '"'; };
        str += ',nonce="' + this._nonce + '"';
        str += ',cnonce="' + cnonce + '"';
        str += ',nc=' + nc;
        str += ',qop=' + qop;
        str += ',digest-uri="' + uri + '"';
        var base = crypto.createHash('md5')
            .update(cred.username)
            .update(':')
            .update(realm)
            .update(':')
            .update(cred.password)
            .digest();
        ha1 = crypto.createHash('md5')
            .update(base)
            .update(':')
            .update(this._nonce)
            .update(':')
            .update(cnonce);
        if (cred.authzid) {
            ha1.update(':').update(cred.authzid);
        }
        ha1 = ha1.digest('hex');
        ha2 = crypto.createHash('md5')
            .update('AUTHENTICATE:')
            .update(uri);
        if (qop === 'auth-int' || qop === 'auth-conf') {
            ha2.update(':00000000000000000000000000000000');
        }
        ha2 = ha2.digest('hex');
        digest = crypto.createHash('md5')
            .update(ha1)
            .update(':')
            .update(this._nonce)
            .update(':')
            .update(nc)
            .update(':')
            .update(cnonce)
            .update(':')
            .update(qop)
            .update(':')
            .update(ha2)
            .digest('hex');
        str += ',response=' + digest;
        if (this._charset == 'utf-8') { str += ',charset=utf-8'; }
        if (cred.authzid) { str += 'authzid="' + cred.authzid + '"'; }
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
        var dtives = parse(chal);

        // TODO: Implement support for multiple realm directives, as allowed by the
        //       DIGEST-MD5 specification.
        this._realm = dtives['realm'];
        this._nonce = dtives['nonce'];
        this._qop = (dtives['qop'] || 'auth').split(',');
        this._stale = dtives['stale'];
        this._maxbuf = parseInt(dtives['maxbuf']) || 65536;
        this._charset = dtives['charset'];
        this._algo = dtives['algorithm'];
        this._cipher = dtives['cipher'];
        if (this._cipher) { this._cipher.split(','); }
        return this;
    };


    /**
     * Parse challenge.
     *
     * @api private
     */
    function parse(chal) {
        var dtives = {};
        var tokens = chal.split(/,(?=(?:[^"]|"[^"]*")*$)/);
        for (var i = 0, len = tokens.length; i < len; i++) {
            var dtiv = /(\w+)=["]?([^"]+)["]?$/.exec(tokens[i]);
            if (dtiv) {
                dtives[dtiv[1]] = dtiv[2];
            }
        }
        return dtives;
    }

    /**
     * Return a unique nonce with the given `len`.
     *
     *     genNonce(10)();
     *     // => "FDaS435D2z"
     *
     * @param {Number} len
     * @return {Function}
     * @api private
     */
    function genNonce(len) {
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
            , charlen = chars.length;

        return function () {
            var buf = [];
            for (var i = 0; i < len; ++i) {
                buf.push(chars[Math.random() * charlen | 0]);
            }
            return buf.join('');
        }
    }

    exports = module.exports = Mechanism;

}));