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

  var clientPut = client.put('key', 'value');

  var clientGet = clientPut.then(
      function() { return client.get('key'); });

  var showGet = clientGet.then(
      function(value) { console.log('get(key)=' + value); });

  var clientRemove = showGet.then(
      function() { return client.remove('key'); });

  var showRemove = clientRemove.then(
      function(success) { console.log('remove(key)=' + success); });

  var clientStats = showRemove.then(
    function() { return client.stats(); });

  var showStats = clientStats.then(
    function(stats) {
      console.log('Number of stores: ' + stats.stores);
      console.log('Number of cache hits: ' + stats.hits);
      console.log('All statistics: ' + JSON.stringify(stats, null, " "));
    });

  return showStats.finally(
      function() { return client.disconnect(); });

}).catch(function(error) {

  console.log("Got error: " + error.message);

});
