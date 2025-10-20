var connected = infinispan.client({port: 11222, host: '127.0.0.1'},
  {
    clusters: [
      {
        name: 'LON',
        servers: [{port: 11222, host: 'LON-host'}]
      },
      {
        name: 'NYC',
        servers: [{port: 11222, host: 'NYC-host1'}, {port: 11322, host: 'NYC-host2'}]
      }
    ]
  });

connected.then(function (client) {

  var switchToB = client.getTopologyInfo().switchToCluster('NYC');

  switchToB.then(function(switchSucceed) {

    if (switchSucceed) {
      ...
    }

    ...

    var switchToDefault = client.getTopologyInfo().switchToDefaultCluster();

    switchToDefault.then(function(switchSucceed) {

      if (switchSucceed) {
        ...
      }

    })

  })

});
