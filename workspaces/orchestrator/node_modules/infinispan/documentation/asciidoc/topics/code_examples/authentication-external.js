var connected = infinispan.client(
  {port: 11222, host: '127.0.0.1'},
  {
    authentication: {
      enabled: true,
      saslMechanism: 'EXTERNAL'
    },
    ssl: {
      enabled: true,
      clientAuth: {
        cert: 'out/ssl/client/client.p12',
      }
    }
  }
);
