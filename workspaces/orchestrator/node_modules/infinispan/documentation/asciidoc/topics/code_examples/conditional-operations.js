var infinispan = require('infinispan');

var connected = infinispan.client(
  {port: 11222, host: '127.0.0.1'}
  {
    // Configure client connections with authentication and encryption here.
  }
);

connected.then(function (client) {

  var clientPut = client.putIfAbsent('cond', 'v0');

  var showPut = clientPut.then(
      function(success) { console.log(':putIfAbsent(cond)=' + success); });

  var clientReplace = showPut.then(
      function() { return client.replace('cond', 'v1'); } );

  var showReplace = clientReplace.then(
      function(success) { console.log('replace(cond)=' + success); });

  var clientGetMetaForReplace = showReplace.then(
      function() { return client.getWithMetadata('cond'); });

  // Call the getWithMetadata method to retrieve the value and its metadata.
  var clientReplaceWithVersion = clientGetMetaForReplace.then(
      function(entry) {
        console.log('getWithMetadata(cond)=' + JSON.stringify(entry));
        return client.replaceWithVersion('cond', 'v2', entry.version);
      }
  );

  var showReplaceWithVersion = clientReplaceWithVersion.then(
      function(success) { console.log('replaceWithVersion(cond)=' + success); });

  var clientGetMetaForRemove = showReplaceWithVersion.then(
      function() { return client.getWithMetadata('cond'); });

  var clientRemoveWithVersion = clientGetMetaForRemove.then(
      function(entry) {
        console.log('getWithMetadata(cond)=' + JSON.stringify(entry));
        return client.removeWithVersion('cond', entry.version);
      }
  );

  var showRemoveWithVersion = clientRemoveWithVersion.then(
      function(success) { console.log('removeWithVersion(cond)=' + success)});

  return showRemoveWithVersion.finally(
      function() { return client.disconnect(); });

}).catch(function(error) {

  console.log("Got error: " + error.message);

});
