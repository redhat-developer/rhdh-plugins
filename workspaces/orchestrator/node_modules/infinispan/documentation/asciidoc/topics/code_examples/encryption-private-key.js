var connected = infinispan.client({port: 11222, host: '127.0.0.1'},
  {
    ssl: {
      enabled: true,
      trustCerts: ['my-root-ca.crt.pem'],
      clientAuth: {
        key: 'privkey.pem',
        passphrase: 'secret',
        cert:ssl 'cert.pem'
      }
    }
  }
);
