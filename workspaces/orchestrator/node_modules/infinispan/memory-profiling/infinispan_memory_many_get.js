var _ = require('underscore');
var infinispan = require('../lib/infinispan');
var helper = require('./helper');

var connected = infinispan.client({port: 11222, host: '127.0.0.1'},{cacheName: 'namedCache'});
console.log("Connected to JDG server");
connected.then(function (client) {
  var key = "memory-one-get";

  var put= client.put(key, " test");

  return put.then(function() {
    var heapUseAfterPut = process.memoryUsage().heapUsed;

    var temp = [];
    var numOps = 10000; // 500000

    _.map(_.range(numOps), function(i) {
      temp.push(client.get(key).then(function(value) {
        console.log("[get] Value: " + value);
      }));
    });

    var ps = Promise.all(temp);
    var completed = ps.then(function() {
      global.gc();
      return process.memoryUsage().heapUsed;
    });

    temp = null;
    ps = null;

    return completed.then(function(heapAfterManyGets) {
      return client.get(key).then(function(value) {
        console.log("[after-gets] Value: " + value);

        global.gc();
        var heapAfterFinalGet = process.memoryUsage().heapUsed;

        console.log("After first put, heap used: " + heapUseAfterPut);
        console.log("After many gets, heap used: " + heapAfterManyGets);
        console.log("After final get, heap used: " + heapAfterFinalGet);

        return client.disconnect();
      });
    });
  });
}).catch(function(err) {
  console.log("Error: " + err);
});