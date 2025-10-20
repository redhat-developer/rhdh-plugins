var infinispan = require('infinispan');

var connected = infinispan.client(
  {port: 11222, host: '127.0.0.1'},
  {
    cacheName: 'myCache',
    authentication: {
        enabled: true,
        saslMechanism: 'DIGEST-MD5',
        userName: 'username',
        password: 'changeme'
    }
  }
);

connected.then(function (client) {
  var data = [
    {key: 'multi1', value: 'v1'},
    {key: 'multi2', value: 'v2'},
    {key: 'multi3', value: 'v3'}];

  var clientPutAll = client.putAll(data);

  var clientGetAll = clientPutAll.then(
    function() { return client.getAll(['multi2', 'multi3']); });

  var showGetAll = clientGetAll.then(
    function(entries) {
      console.log('getAll(multi2, multi3)=%s', JSON.stringify(entries));
    }
  );

  var clientIterator = showGetAll.then(
    function() { return client.iterator(1); });

  var showIterated = clientIterator.then(
    function(it) {
      function loop(promise, fn) {
        // Simple recursive loop over the iterator's next() call.
        return promise.then(fn).then(function (entry) {
          return entry.done
            ? it.close().then(function () { return entry.value; })
            : loop(it.next(), fn);
        });
      }

      return loop(it.next(), function (entry) {
        console.log('iterator.next()=' + JSON.stringify(entry));
        return entry;
      });
    }
  );

  var clientClear = showIterated.then(
    function() { return client.clear(); });

  return clientClear.finally(
    function() { return client.disconnect(); });

}).catch(function(error) {

  console.log("Got error: " + error.message);

});
