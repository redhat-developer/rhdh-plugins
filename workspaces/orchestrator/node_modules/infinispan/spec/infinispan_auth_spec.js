var t = require('./utils/testing'); // Testing dependency

describe('Infinispan local client', function () {
  [ 'SCRAM-SHA-1', 'SCRAM-SHA-256', 'SCRAM-SHA-384', 'SCRAM-SHA-512', 'PLAIN', 'DIGEST-MD5'].forEach(m => 
  it(m, function (done) {
    t.client(t.local, {
      authentication: {
        enabled: true,
        saslMechanism: m,
        userName: 'admin',
        password: 'pass'
      }
    })
    .then(t.assert(t.put('key', 'value')))
    .then(t.disconnect())
    .catch(t.failed(done))
    .finally(done);
  }));
});
