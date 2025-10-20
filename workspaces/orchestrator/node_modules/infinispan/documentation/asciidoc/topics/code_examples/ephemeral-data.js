var infinispan = require('infinispan');

var connected = infinispan.client(
  {port: 11222, host: '127.0.0.1'}
  {
    // Configure client connections with authentication and encryption here.
  }
);

connected.then(function (client) {

  var clientPutExpiry = client.put('expiry', 'value', {lifespan: '1s'});

  var clientGetMetaAndSize = clientPutExpiry.then(
    function() {
      // Compute getWithMetadata and size in parallel.
      return Promise.all([client.getWithMetadata('expiry'), client.size()]);
    });

  var showGetMetaAndSize = clientGetMetaAndSize.then(
    function(values) {
      console.log('Before expiration:');
      console.log('getWithMetadata(expiry)=' + JSON.stringify(values[0]));
      console.log('size=' + values[1]);
    });

  var clientContainsAndSize = showGetMetaAndSize.then(
    function() {
      sleepFor(1100); // Sleep to force expiration.
      return Promise.all([client.containsKey('expiry'), client.size()]);
    });

  var showContainsAndSize = clientContainsAndSize.then(
    function(values) {
      console.log('After expiration:');
      console.log('containsKey(expiry)=' + values[0]);
      console.log('size=' + values[1]);
    });

  return showContainsAndSize.finally(
    function() { return client.disconnect(); });

}).catch(function(error) {

  console.log("Got error: " + error.message);

});

function sleepFor(sleepDuration){
  var now = new Date().getTime();
  while(new Date().getTime() < now + sleepDuration){ /* Do nothing. */ }
}
