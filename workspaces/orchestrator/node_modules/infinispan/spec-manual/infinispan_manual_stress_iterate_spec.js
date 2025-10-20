var _ = require('underscore');

var f = require('../lib/functional');
var t = require('../spec/utils/testing'); // Testing dependency

describe('Infinispan local client under iterate stress load', function () {
  var client = t.client(t.local, t.authOpts);

  beforeEach(function (done) {
    client
        .then(t.assert(t.clear()))
        .catch(t.failed(done)).finally(done);
  });

  it('can do many iterates continuously', function (done) {
    client.then(function (cl) {
      var singleInsert = cl.put("key0", JSON.stringify({ test: "test de prueba con un texto largo", token: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.' }));

      var numEntries = 100000;

      var multiInsert = _.map(_.range(numEntries), function(i) {
        if (_.isEqual(i % 10000, 0))
          console.log(i + ' operations...');

        return singleInsert.then(function () {
          cl.put("key" + i, JSON.stringify({ test: "test de prueba con un texto largo", token: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.' }))
        });
      });

      var multiIterate = singleInsert.then(function () {
        console.log("1");
        return test(cl);
      })
      .then(function (result) {
        console.log("2, entries iterated: " + result.length);
        expect(result.length).toBe(numEntries + 1);
        return test(cl);
      })
      .then(function (result) {
        console.log("3, entries iterated: " + result.length);
        expect(result.length).toBe(numEntries + 1);
        return test(cl);
      })
      .then(function (result) {
        console.log("4, entries iterated: " + result.length);
        expect(result.length).toBe(numEntries + 1);
      });

      // TODO multi iterate should return same result

      return Promise.all(f.cat([multiIterate], multiInsert))
          .catch(t.failed(done))
          .finally(done);
    })
  }, 180000);

  function test (cl) {
    var iterator = cl.iterator(100);
    var entries = [];
    return iterator
        .then(function (it) {
          function loop(promise, fn) {
            return promise.then(fn).then(function (entry) {
              return !entry.done ? loop(it.next(), fn) : entry.value;
            });
          }
          return loop(it.next(), function (entry) {
            entries.push(entry);
            //console.log(`entry ${JSON.stringify(entry)}`)
            return entry;
          });
        })
        .then(function () {
          return entries;
        });
  }

  // Since Jasmine 1.3 does not have afterAll callback, this disconnect test must be last
  it('disconnects client', function (done) {
    client
        .then(t.disconnect())
        .catch(t.failed(done))
        .finally(done);
  });

});