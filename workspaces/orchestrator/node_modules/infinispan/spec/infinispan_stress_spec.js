var _ = require('underscore');

var t = require('./utils/testing'); // Testing dependency

describe('Infinispan local client under stress load', function() {
  var client = t.client(t.local, t.authOpts);

  beforeEach(function(done) { client
    .then(t.assert(t.clear()))
    .catch(t.failed(done)).finally(done);
  });

  it('can do multiple puts continuously and only wait at the end', function(done) {
    client.then(function(cl) {
      var puts = _.map(_.range(1000), function(i) {
        return cl.put(i + '', i + '');
      });

      return Promise.all(puts)
        .catch(t.failed(done))
        .finally(done);
    })
  });

  // Since Jasmine 1.3 does not have afterAll callback, this disconnect test must be last
  it('disconnects client', function(done) { client
    .then(t.disconnect())
    .catch(t.failed(done))
    .finally(done);
  });

});