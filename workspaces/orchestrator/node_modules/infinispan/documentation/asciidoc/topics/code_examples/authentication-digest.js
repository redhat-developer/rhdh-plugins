var connected = infinispan.client(
  {port: 11222, host: '127.0.0.1'},
  {
    authentication: {
      enabled: true,
      saslMechanism: 'DIGEST-MD5',
      userName: 'username',
      password: 'changeme',
      serverName: 'infinispan'
    }
  }
);
