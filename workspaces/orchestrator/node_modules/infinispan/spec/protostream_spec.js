//'use strict';

var _ = require('underscore');
var path = require('path');
var long = require('long');

var t = require('./utils/testing'); // Testing dependency
var protobuf = require('protobufjs');
const { iteratee } = require('underscore');
var ispn = require('../lib/infinispan');

var myMsg = `package awesomepackage;
syntax = "proto3";
/**
 * @TypeId(1000043)
 */
message AwesomeMessage {
string awesome_field = 1;
}`

var myMsg2 = `package awesomepackage;
/**
 * @TypeId(1000043)
 */
message AwesomeMessage {
    required string awesome_field = 1;
}`

var myMsg3 = `package awesomepackage;
/**
 * @TypeId(1000044)
 */
message AwesomeUser {
    required string name = 1;
    required int64 age = 2;
    required bool isVerified =3;
}`

var p30 = t.protocol30({
    dataFormat: {
        keyType: 'text/plain',
        valueType: 'application/x-protostream'
    }
});

describe('Protobuf encoding', function () {
    var expectedArray = [0x0a, 0x0d, 0x41, 0x77, 0x65, 0x73, 0x6f, 0x6d, 0x65, 0x53, 0x74, 0x72, 0x69, 0x6e, 0x67];
    var expectedBuffer = Buffer.from(expectedArray);
    it("Encodes a proto message", function () {
        root = protobuf.parse(myMsg).root;

        // Obtain a message type
        var AwesomeMessage = root.lookupType(".awesomepackage.AwesomeMessage");
        var payload = { awesomeField: "AwesomeString" };
        var errMsg = AwesomeMessage.verify(payload);
        expect(errMsg === null).toBeTruthy();
        var message = AwesomeMessage.create(payload); // or use .fromObject if conversion is necessary
        var buffer = AwesomeMessage.encode(message).finish();
        expect(Buffer.compare(buffer, expectedBuffer)).toBe(0);
    });
}
);

describe('Protostream encoding', function () {
    p30.registerProtostreamType(".awesomepackage.AwesomeMessage", 1000043);

    it("Returns the Protostream type", function () {
        var psType = p30.lookupProtostreamTypeByName(".awesomepackage.AwesomeMessage");
        expect(psType).toBe(1000043);
    });

    it("Encodes a Protostream message", function () {
        root = protobuf.parse(myMsg).root;
        protobuf.loadSync(path.join(__dirname + '/../lib/protostream/message-wrapping.proto'), root);
        // Obtain message types
        var AwesomeMessage = root.lookupType(".awesomepackage.AwesomeMessage");
        var WrappedMessage = root.lookupType(".org.infinispan.protostream.WrappedMessage");
        // Build input message
        var payload = { awesomeField: "AwesomeString" };
        var errMsg = AwesomeMessage.verify(payload);
        expect(errMsg === null).toBeTruthy();
        var message = AwesomeMessage.create(payload);
        // Build manually WrappedMessage
        var buffer = AwesomeMessage.encode(message).finish();
        var wmPayload = {
            wrappedMessage: buffer,
            wrappedTypeId: 1000043
        };
        errMsg = WrappedMessage.verify(wmPayload);
        expect(errMsg === null).toBeTruthy();
        var wmMessage = WrappedMessage.create(wmPayload);
        var expectedWMBuffer = WrappedMessage.encode(wmMessage).finish();

        // Call client API for encoding
        var outBuf = t.newByteBuf(32);
        p30.encodeMediaValue(message)(outBuf);
        // outBuf contains the WM encoded by the client

        // Removing buf length at the beginning for comparison
        var trimmed = outBuf.buf.slice(1, outBuf.offset);
        // check the client produces same byte buffer
        expect(Buffer.compare(trimmed, expectedWMBuffer)).toBe(0);

    });
}
);

describe("Put/Get protostream object to/from Infinispan", function () {
    it("Puts protostream on Infinispan", async function (done) {
        var root = protobuf.parse(myMsg).root;
        var AwesomeMessage = root.lookupType(".awesomepackage.AwesomeMessage");
    try {
            var protoMetaClient = await ispn.client(t.local, { authentication: t.authOpts.authentication, cacheName: '___protobuf_metadata', dataFormat: { keyType: "text/plain", valueType: "text/plain" } });
            var client = await t.client(t.local, { authentication: t.authOpts.authentication, cacheName: 'protoStreamCache', dataFormat: { keyType: "text/plain", valueType: "application/x-protostream" } });
            var payload = { awesomeField: "AwesomeString" };
            var errMsg = AwesomeMessage.verify(payload);
            expect(errMsg === null).toBeTruthy();
            var message = AwesomeMessage.create(payload);

            await protoMetaClient.put("awesomepackage/AwesomeMessage.proto", myMsg2);

            await client.clear();
            expect(await client.size()).toBe(0);
            await client.put("myKey", message);
            expect(await client.size()).toBe(1);
            await client.put("myKey1", 1.2);
            await client.put("myKey2","string");
            await client.put("myKey3",true);
            await client.put("myKey4",new ArrayBuffer(8));
            expect(await client.size()).toBe(5);

            protoMetaClient.disconnect();
            client.disconnect();
            done();
        } catch (error) {
            protoMetaClient.disconnect();
            client.disconnect();
            done(new Error(error));
        }
    }
    );

    it("Gets protostream on Infinispan", async function (done) {
        try {
            var protoMetaClient = await ispn.client(t.local, { authentication: t.authOpts.authentication, cacheName: '___protobuf_metadata', dataFormat: { keyType: "text/plain", valueType: "text/plain" } });
            var client = await t.client(t.local, { authentication: t.authOpts.authentication, cacheName: 'protoStreamCache', dataFormat: { keyType: "text/plain", valueType: "application/x-protostream" } });
            client.registerProtostreamRoot(root);
            var myObj=await client.get("myKey");
            var myObj1=await client.get("myKey1");
            var myObj2=await client.get("myKey2");
            var myObj3=await client.get("myKey3");
            var myObj4=await client.get("myKey4"); 
            protoMetaClient.disconnect();
            await client.clear();
            client.disconnect();
            done();
        } catch (error) {
            protoMetaClient.disconnect();
            client.disconnect();
            done(new Error(error));
        }
    }
    );
});

describe('Querying in application/x-protostream format',function () {
    var root = protobuf.parse(myMsg).root;
    var AwesomeMessage = root.lookupType(".awesomepackage.AwesomeMessage");
    var root2 = protobuf.parse(myMsg3).root;
    var AwesomeUser = root2.lookupType(".awesomepackage.AwesomeUser");
    it("Queries the server without projection", async function (done) {
        try{
            var protoMetaClient = await ispn.client(t.local, { authentication: t.authOpts.authentication, cacheName: '___protobuf_metadata', dataFormat: { keyType: "text/plain", valueType: "text/plain" } });
            var client = await t.client(t.local, { authentication: t.authOpts.authentication, cacheName: 'protoStreamCache', dataFormat: { keyType: "application/x-protostream", valueType: "application/x-protostream" } });
            await protoMetaClient.put("awesomepackage/AwesomeMessage.proto", myMsg2);
            await client.clear();
            for(let i=0;i<10;i++){
                var payload = { awesomeField: "AwesomeString"+i };
                var message = AwesomeMessage.create(payload);
                await client.put(i,message)
            }
            var queryResp1 = await client.query({queryString:`from awesomepackage.AwesomeMessage ORDER BY awesome_field`});
            expect(queryResp1.length).toBe(10);
            var queryResp2 = await client.query({queryString:`from awesomepackage.AwesomeMessage a where a.awesome_field='AwesomeString1'`});
            expect(queryResp2.length).toBe(1);
            expect(queryResp2[0].awesomeField).toEqual('AwesomeString1');
            var queryResp3 = await client.query({queryString:`from awesomepackage.AwesomeMessage a where a.awesome_field='AwesomeString100'`});
            expect(queryResp3.length).toEqual(0);
            protoMetaClient.disconnect();
            await client.clear();
            client.disconnect();
            done();
        }catch (error) {
            protoMetaClient.disconnect();
            client.disconnect();
            done(new Error(error));
        }
    });

    it("Queries the server with projection", async function (done) {
        try{
            var protoMetaClient = await ispn.client(t.local, { authentication: t.authOpts.authentication, cacheName: '___protobuf_metadata', dataFormat: { keyType: "text/plain", valueType: "text/plain" } });
            var client = await t.client(t.local, { authentication: t.authOpts.authentication, cacheName: 'protoStreamCache', dataFormat: { keyType: "application/x-protostream", valueType: "application/x-protostream" } });
            await protoMetaClient.put("awesomepackage/AwesomeUser.proto", myMsg3);
            client.registerProtostreamRoot(root2);
            client.registerProtostreamType(".awesomepackage.AwesomeUser",1000044);
            await client.clear();
            for (let i = 0; i < 10; i++){
                var payload = { name: "AwesomeString"+i , age : i , isVerified: (Math.random()<0.5)};
                var message = AwesomeUser.create(payload);
                await client.put(i,message)
            }
            var query1 = await client.query({ queryString: `select u.name,u.age from awesomepackage.AwesomeUser u where u.age<20 order by u.name asc` });
            expect(query1.length).toBe(10);
            expect(query1[0].length).toBe(2);
            for (let i = 0; i < 10; i++) {
                expect(_.isEqual(query1[i][1], long.fromValue(i))).toBeTruthy();
            }
            var query2 = await client.query({queryString:`select u.name from awesomepackage.AwesomeUser u where u.age=2`});
            expect(query2[0][0]).toBe("AwesomeString2");

            var query3 = await client.query({queryString:`select u.name from awesomepackage.AwesomeUser u where u.age>20`});
            expect(query3.length).toBe(0);

            protoMetaClient.disconnect();
            await client.clear();
            client.disconnect();
            done();
        }catch (error) {
            protoMetaClient.disconnect();
            client.disconnect();
            done(new Error(error));
        }
    });
    
}
);