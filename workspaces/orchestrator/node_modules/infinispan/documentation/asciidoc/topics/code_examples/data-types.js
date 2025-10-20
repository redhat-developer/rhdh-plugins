var infinispan = require('infinispan');

var connected = infinispan.client(
    {port: 11222, host: '127.0.0.1'},
    {
        dataFormat : {
            keyType: 'application/json',
            valueType: 'application/json'
        }
    }
);

connected.then(function (client) {

  var clientPut = client.put({k: 'key'}, {v: 'value'});

  var clientGet = clientPut.then(
      function() { return client.get({k: 'key'}); });

  var showGet = clientGet.then(
      function(value) { console.log("get({k: 'key'})=" + JSON.stringify(value)); });

  return showGet.finally(
      function() { return client.disconnect(); });

}).catch(function(error) {

  console.log("Got error: " + error.message);

});
