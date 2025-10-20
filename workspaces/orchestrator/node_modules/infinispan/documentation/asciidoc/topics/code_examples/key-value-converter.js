var infinispan = require('infinispan');

var connected = infinispan.client(
    {port: 11222, host: '127.0.0.1'}
    , {
        dataFormat : {
            keyType: 'application/json',
            valueType: 'application/json'
        }
    }
);

connected.then(function (client) {
    // Include the remote event converter to avoid unnecessary roundtrips.
    var opts = {
        converterFactory : {
            name: "key-value-with-previous-converter-factory"
        }
    };

    var clientAddListenerCreate = client.addListener('create', logEvent("Created"), opts);

    var clientAddListeners = clientAddListenerCreate.then(
        function(listenerId) {
            // Associate multiple callbacks with a single client-side listener.
            // To do this, register listeners with the same listener ID.
            var clientAddListenerModify =
                client.addListener('modify', logEvent("Modified"), {opts, listenerId: listenerId});

            var clientAddListenerRemove =
                client.addListener('remove', logEvent("Removed"), {opts, listenerId: listenerId});

            return Promise.all([clientAddListenerModify, clientAddListenerRemove]);
        });

    var clientCreate = clientAddListeners.then(
        function() { return client.putIfAbsent('converted', 'v0'); });

    var clientModify = clientCreate.then(
        function() { return client.replace('converted', 'v1'); });

    var clientRemove = clientModify.then(
        function() { return client.remove('converted'); });

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

function logEvent(prefix) {
    return function(event) {
        console.log(prefix + " key: " + event.key);
        console.log(prefix + " value: " + event.value);
        console.log(prefix + " previous value: " + event.prev);
    }
}
