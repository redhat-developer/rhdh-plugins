const infinispan = require("infinispan");

const log4js = require('log4js');
log4js.configure('example-log4js.json');

async function test() {
  let client = await infinispan.client({port: 11222, host: '127.0.0.1'});
  console.log(`Connected to Infinispan dashboard data`);

  let data = [
    {key: 'multi1', value: 'v1'},
    {key: 'multi2', value: 'v2'},
    {key: 'multi3', value: 'v3'}];

  await client.putAll(data);

  let entries = await client.getAll(['multi2', 'multi3']);
  console.log('getAll(multi2, multi3)=%s', JSON.stringify(entries));

  let iterator = await client.iterator(1);

  let entry = {done: true};

  do {
    entry = await iterator.next();
    console.log('iterator.next()=' + JSON.stringify(entry));
  } while (!entry.done);

  await iterator.close();

  await client.clear();

  await client.disconnect();
}

test();
