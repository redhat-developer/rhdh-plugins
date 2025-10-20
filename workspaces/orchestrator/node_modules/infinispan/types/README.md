This directory contains all the type definitions that are used in this libray.

The below code can be used for testing the type support.

```
const protobuf = require("protobufjs");
const infinispan = require("./lib/infinispan.js");


var client = infinispan.client(
  { port: 11222, host: "127.0.0.1" },
  {
    dataFormat: {
      keyType: "application/x-protostream",
      valueType: "application/x-protostream",
    },
    authentication: {
      enabled: true,
      saslMechanism: "DIGEST-MD5",
      userName: "admin",
      password: "pass",
      serverName: "infinispan",
    },
    cacheName: "protoStreamCache",
  }
);

var protoMetaClient = infinispan.client({ port: 11222, host: "127.0.0.1" }, {
  authentication: {
    enabled: true,
    saslMechanism: "DIGEST-MD5",
    userName: "admin",
    password: "pass",
    serverName: "infinispan",
  },
  cacheName: "___protobuf_metadata",
  dataFormat: { keyType: "text/plain", valueType: "text/plain" },
});

protoMetaClient.then(async function (client) {
  var myMsg2 = `package awesomepackage;
  /**
   * @TypeId(1000042)
   */
  message AwesomeMessages {
      required string name = 1;
      required int64 age = 2;
  
  }`
  await client.put("awesomepackage/AwesomeMessage.proto", myMsg2);
  await client.disconnect();
})


client.then(async function (client) {
  var myMsg2 = `package awesomepackage;
    /**
     * @TypeId(1000042)
     */
    message AwesomeMessages {
        required string name = 1;
        required int64 age = 2;
    
    }`;


  let root = protobuf.parse(myMsg2).root;
  let user = root.lookupType('awesomepackage.AwesomeMessages');
  client.registerProtostreamType('.awesomepackage.AwesomeMessages', 1000042);
  client.registerProtostreamRoot(root);
  try {
    for (let i = 0; i < 10; i++) {
      let payload = { name: "Neeraj" + i, age: 20 + i };
      let buf = user.create(payload);
      await client.put(i + 1, buf);
      console.log(await client.getWithMetadata(1));
    }
    var decoded = await client.query({ queryString: `select u.name,u.age from awesomepackage.AwesomeMessages u where u.age>20` });
    console.log(decoded);
    await client.disconnect();
  } catch (error) {
    console.log(error);
  }

});
```

In the put method, if someone provides only one argument then the compiler will throw the error as below :
`index.ts:70:18 - error TS2554: Expected 2-3 arguments, but got 1.`

The same follows for all the operations. There is a validation on client config also.
