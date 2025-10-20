var infinispan = require('infinispan');
var readFile = Promise.denodeify(require('fs').readFile);

var connected = infinispan.client(
  {port: 11222, host: '127.0.0.1'}
  {
    // Configure client connections with authentication and encryption here.
  }
);

connected.then(function (client) {

  var addScriptFile = readFile('sample-script.js').then(
    function(file) {
      return client.addScript('sample-script', file.toString());
    });

  var clientExecute = addScriptFile.then(
    function() {
      return client.execute('sample-script', {k: 'exec-key', v: 'exec-value'});
    });

  var showExecute = clientExecute.then(
    function(ret) { console.log('Script execution returned: ' + ret); });

  return showExecute.finally(
    function() { return client.disconnect(); });

}).catch(function(error) {

  console.log("Got error: " + error.message);

});
