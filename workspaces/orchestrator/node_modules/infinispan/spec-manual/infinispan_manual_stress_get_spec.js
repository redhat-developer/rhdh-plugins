var _ = require('underscore');

var t = require('../spec/utils/testing'); // Testing dependency

describe('Infinispan local client under read stress load', function () {
  var client = t.client(t.local, authOpts);

  beforeEach(function (done) {
    client
        .then(t.assert(t.clear()))
        .catch(t.failed(done)).finally(done);
  });

  it('can do many gets continuously', function (done) {
    client.then(function (cl) {
      var key = "stress-get";
      var put = cl.put(key, "test");

      var gets = _.map(_.range(100000), function(i) {
        if (_.isEqual(i % 10000, 0))
          console.log(i + ' operations...');

        var get = put.then(
          function() { return cl.get(key); }
        );

        // Print out the key that was retrieved
        return get.then(
          function(value) {
            //console.log('get(key)=' + value);
            expect(value).toBe("test");
          }
        );
      });

      return Promise.all(gets)
          .catch(t.failed(done))
          .finally(done);
    })
  }, 120000);

  // Since Jasmine 1.3 does not have afterAll callback, this disconnect test must be last
  it('disconnects client', function (done) {
    client
        .then(t.disconnect())
        .catch(t.failed(done))
        .finally(done);
  });

});