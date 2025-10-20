var _ = require('underscore');

var util = require('util');

var t = require('./utils/testing'); // Testing dependency

describe('Infinispan TLS/SSL client', function() {

  it('can operate on data via trusted encrypted transport',
     testSsl('trust', t.ssl, sslTrust())
  );

  it('can operate on data via crypto store trusted encrypted transport',
     testSsl('trust-cryptostore', t.ssl, sslTrustCryptoStore())
  );

  it('can operate on data via authenticated encrypted transport',
     testSsl('auth', t.ssl, sslAuth())
  );

  it('can operate on data via SNI trusted encrypted transport',
     testSsl('sni-trusted', t.ssl, sslSniTrusted())
  );

  it('can operate on data via SNI trusted encrypted transport while having multiple identities',
      testSsl('sni-trusted', t.ssl, sslSniTrustedInCaseOfMultipleTrustedSni())
  );

  it('fails to operate if default server name (SNI) does not match default server realm',
     testError(expectContainsAnyErrors(["self signed certificate in certificate chain", "self-signed certificate in certificate chain"]),
               sslSniDefault())
  );

  it('fails to operate if server name (SNI) and trusted certificate are incorrect',
     testError(
       expectAnyExactErrors(
         ['CERT_SIGNATURE_FAILURE'
           , 'certificate signature failure'
           , 'self signed certificate in certificate chain'
           , 'self-signed certificate in certificate chain'
         ])
       , sslSniUntrusted()
     )
  );

  it('fails to operate if no passphrase provided for crypto store',
     testError(expectAnyExactErrors(['No passphrase defined for crypto store']),
               sslStoreNoPassphrase())
  );

  it('fails to operate if no path provided for crypto store',
     testError(expectAnyExactErrors(['No path defined for crypto store']),
               sslStoreNoPath())
  );

  it('fails to operate if no encrypted transport is provided',
      testError(expectAnyExactErrors(['self signed certificate in certificate chain',  'self-signed certificate in certificate chain']),
                sslStoreNoCryptoStore())
  );

  // it('fails to operate if key for authenticated encrypted transport is missing',
  //     testError(expectAnyExactErrors(['CERT_SIGNATURE_FAILURE', 'self signed certificate']),
  //               sslAuthWithMissingKey())
  // );
  //
  // it('fails to operate if passphrase for authenticated encrypted transport is missing',
  //     testError(expectAnyExactErrors(['CERT_SIGNATURE_FAILURE', 'self signed certificate']),
  //               sslAuthWithMissingPassphrase())
  // );

  // it('fails to operate if cert path for authenticated encrypted transport is missing',
  //     testError(expectAnyExactErrors(['CERT_SIGNATURE_FAILURE', 'self signed certificate']),
  //               sslAuthWithMissingCert())
  // );

  // it('fails to operate if authenticated encrypted transport is missing',
  //     testError(expectAnyExactErrors(['CERT_SIGNATURE_FAILURE', 'self signed certificate']),
  //               sslAuthWithMissingInfo())
  // );

  it('fails to operate if trusted certificate is missing for authenticated encrypted transport',
      testError(expectAnyExactErrors(['self signed certificate in certificate chain', 'self-signed certificate in certificate chain']),
                sslAuthWithMissingTrustCertificate())
  );

  function testSsl(infix, addr, sslOpts) {
    var k = util.format('ssl-%s-key', infix);
    var v = util.format('ssl-%s-value', infix);
    return function(done) {
      t.client(addr, sslOpts)
        .then(t.assert(t.put(k, v)))
        .then(t.assert(t.get(k), t.toBe(v)))
        .then(t.disconnect())
        .catch(t.failed(done))
        .finally(done);
    }
  }

  function sslTrust() {
    return {
      ssl: {
        enabled: true,
        secureProtocol: 'TLS_client_method',
        trustCerts: ['out/ssl/ca/ca.pem']
      },
      authentication: {
        enabled: true,
        saslMechanism: 'PLAIN',
        userName: 'admin',
        password: 'pass'
      }
    }
  }

  function sslTrustCryptoStore() {
    return {
      ssl: {
        enabled: true,
        secureProtocol: 'TLS_client_method',
        cryptoStore: {
          path: 'out/ssl/client/client.p12',
          passphrase: 'secret'
        }
      },
      authentication: {
        enabled: true,
        saslMechanism: 'PLAIN',
        userName: 'admin',
        password: 'pass'
      }
    }
  }

  function sslAuth() {
    return {
        ssl: {
          enabled: true,
          trustCerts: ['out/ssl/ca/ca.pem'],
          clientAuth: {
            key: 'out/ssl/client/client.pk',
            passphrase: 'secret',
            cert: 'out/ssl/client/client.pem'
          }
        },
        authentication: {
          enabled: true,
          saslMechanism: 'PLAIN',
          userName: 'admin',
          password: 'pass'
        }
    }
  }

  function sslSniTrusted() {
    return {
      ssl: {
        enabled: true,
        trustCerts: ['out/ssl/ca/ca.pem'],
        sniHostName: 'localhost'
      },
      authentication: {
        enabled: true,
        saslMechanism: 'PLAIN',
        userName: 'admin',
        password: 'pass'
      }
    }
  }

  function sslSniTrustedInCaseOfMultipleTrustedSni() {
    return {
        ssl: {
          enabled: true,
          trustCerts: ['out/ssl/ca/ca.pem'],
          sniHostName: 'localhost'
        },
        authentication: {
          enabled: true,
          saslMechanism: 'PLAIN',
          userName: 'admin',
          password: 'pass'
        }
    }
  }

  function sslSniDefault() {
    return {
      ssl: {
        enabled: true,
        trustCerts: ['out/ssl/untrust-ca/untrust-ca.pem'],
        sniHostName: 'trustfail'
      },
      authentication: {
        enabled: true,
        saslMechanism: 'PLAIN',
        userName: 'admin',
        password: 'pass'
      }
    }
  }

  function sslSniDefaultWithTrustedCertificate() {
    return {
      ssl: {
        enabled: true,
        trustCerts: ['out/ssl/ca/ca.pem'],
      },
      authentication: {
        enabled: true,
        saslMechanism: 'PLAIN',
        userName: 'admin',
        password: 'pass'
      }
    }
  }

  function sslSniUntrusted() {
    return {
      ssl: {
        enabled: true,
        trustCerts: ['out/ssl/untrust-ca/untrust-ca.pem'],
        sniHostName: "untrust"
      },
      authentication: {
        enabled: true,
        saslMechanism: 'PLAIN',
        userName: 'admin',
        password: 'pass'
      }
    }
  }

  function testError(errF, sslOpts) {
    return function(done) {
      t.client(t.ssl, sslOpts)
        .then(shouldFail())
        .catch(errF(done))
        .finally(done);
    }
  }

  function shouldFail() {
    return function(client) {
      var disconnect = client.disconnect();
      return disconnect.finally(function() {
        throw Error('Expected operation to fail');
      });
    }
  }

  function expectError(msg) {
    return function(err) {
      expect(err.message).toBe(msg);
    }
  }

  function expectContainsAnyErrors(msg) {
    return function(done) {
      return function(err) {
        toContainAnyOf(msg, err, done);
      }
    }
  }

  function expectAnyExactErrors(msgs) {
    return function(done) {
      return function(err) {
        toBeAnyOf(msgs, err, done);
      }
    }
  }

  function sslStoreNoPassphrase() {
    return {
      ssl: {
        enabled: true,
        cryptoStore: {
          path: 'out/ssl/client/client.p12'
        }
      },
      authentication: {
        enabled: true,
        saslMechanism: 'PLAIN',
        userName: 'admin',
        password: 'pass'
      }
    }
  }

  function sslStoreNoPath() {
    return {
      ssl: {
        enabled: true,
        cryptoStore: {}
      },
      authentication: {
        enabled: true,
        saslMechanism: 'PLAIN',
        userName: 'admin',
        password: 'pass'
      }
    }
  }

  function sslStoreNoCryptoStore() {
    return {
      ssl: {
        enabled: true
      },
      authentication: {
        enabled: true,
        saslMechanism: 'PLAIN',
        userName: 'admin',
        password: 'pass'
      }
    }
  }

  function sslSniWithNoCert() {
    return {
      ssl: {
        enabled: true,
        sniHostName: "untrust"
      },
      authentication: {
        enabled: true,
        saslMechanism: 'PLAIN',
        userName: 'admin',
        password: 'pass'
      }
    }
  }

  function sslAuthWithMissingKey() {
    return {
      ssl: {
        enabled: true,
        trustCerts: ['out/ssl/ca/ca.pem'],
        clientAuth: {
          passphrase: 'secret',
          cert: 'out/ssl/client/client.pem'
        },
        authentication: {
          enabled: true,
          saslMechanism: 'PLAIN',
          userName: 'admin',
          password: 'pass'
        }
      }
    }
  }

  function sslAuthWithMissingPassphrase() {
    return {
      ssl: {
        enabled: true,
        trustCerts: ['out/ssl/ca/ca.pem'],
        clientAuth: {
          key: 'out/ssl/client/client.pk',
          cert: 'out/ssl/client/client.pem'
        },
        authentication: {
          enabled: true,
          saslMechanism: 'PLAIN',
          userName: 'admin',
          password: 'pass'
        }
      }
    }
  }

  function sslAuthWithMissingCert() {
    return {
      ssl: {
        enabled: true,
        trustCerts: ['out/ssl/ca/ca.pem'],
        clientAuth: {
          key: 'out/ssl/client/client.pk',
          passphrase: 'secret'
        }
      },
      authentication: {
        enabled: true,
        saslMechanism: 'PLAIN',
        userName: 'admin',
        password: 'pass'
      }
    }
  }

  function sslAuthWithMissingInfo() {
    return {
      ssl: {
        enabled: true,
        trustCerts: ['out/ssl/ca/ca.pem'],
        clientAuth: {}
      },
      authentication: {
        enabled: true,
        saslMechanism: 'PLAIN',
        userName: 'admin',
        password: 'pass'
      }
    }
  }

  function sslAuthWithMissingTrustCertificate() {
    return {
      ssl: {
        enabled: true,
        clientAuth: {
          key: 'out/ssl/client/client.pk',
          passphrase: 'secret',
          cert: 'out/ssl/client/client.pem'
        }
      },
      authentication: {
        enabled: true,
        saslMechanism: 'PLAIN',
        userName: 'admin',
        password: 'pass'
      }
    }
  }

  function toBeAnyOf(expecteds, actual, done) {
    for (var i = 0, l = expecteds.length; i < l; i++) {
      if (_.isEqual(actual.message, expecteds[i]))
        return;
    }
    done(new Error('[' + actual.message + '] is not any of: [' + expecteds + ']'));
  }

  function toContainAnyOf(expecteds, actual, done) {
    for (var i = 0, l = expecteds.length; i < l; i++) {
      if (actual.message.includes(expecteds[i]))
        return;
    }
    done(new Error('[' + actual.message + '] does not contain any of: [' + expecteds + ']'));
  }

});
