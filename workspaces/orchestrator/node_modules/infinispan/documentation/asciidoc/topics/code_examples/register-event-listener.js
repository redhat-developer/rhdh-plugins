var infinispan = require('infinispan');

var connected = infinispan.client(
  {port: 11222, host: '127.0.0.1'}
  {
    // Configure client connections with authentication and encryption here.
  }
);

connected.then(function (client) {

    var clientAddListenerCreate = client.addListener('create', onCreate);

    var clientAddListeners = clientAddListenerCreate.then(
        function(listenerId) {
            // Associate multiple callbacks with a single client-side listener.
            // To do this, register listeners with the same listener ID.
            var clientAddListenerModify =
                client.addListener('modify', onModify, {listenerId: listenerId});

            var clientAddListenerRemove =
                client.addListener('remove', onRemove, {listenerId: listenerId});

            return Promise.all([clientAddListenerModify, clientAddListenerRemove]);
        });

    var clientCreate = clientAddListeners.then(
        function() { return client.putIfAbsent('eventful', 'v0'); });

    var clientModify = clientCreate.then(
        function() { return client.replace('eventful', 'v1'); });

    var clientRemove = clientModify.then(
        function() { return client.remove('eventful'); });

    var clientRemoveListener =
        Promise.all([clientAddListenerCreate, clientRemove]).then(
            function(values) {
                var listenerId = values[0];
                return client.removeListener(listenerId);
            });

    return clientRemoveListener.finally(
        function() { return client.disconnect(); });

}).catch(function(error) {

    console.log("Got error: " + error.message);

});

function onCreate(key, version) {
    console.log('[Event] Created key: ' + key +
        ' with version: ' + JSON.stringify(version));
}

function onModify(key, version) {
    console.log('[Event] Modified key: ' + key +
        ', version after update: ' + JSON.stringify(version));
}

function onRemove(key) {
    console.log('[Event] Removed key: ' + key);
}
