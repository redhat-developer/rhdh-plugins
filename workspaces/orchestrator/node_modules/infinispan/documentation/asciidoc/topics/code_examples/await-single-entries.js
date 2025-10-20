const infinispan = require("infinispan");

const log4js = require('log4js');
log4js.configure('example-log4js.json');

async function test() {
  await new Promise((resolve, reject) => setTimeout(() => resolve(), 1000));
  console.log('Hello, World!');

  let client = await infinispan.client({port: 11222, host: '127.0.0.1'});
  console.log(`Connected to Infinispan dashboard data`);

  await client.put('key', 'value');

  let value = await client.get('key');
  console.log('get(key)=' + value);

  let success = await client.remove('key');
  console.log('remove(key)=' + success);

  let stats = await client.stats();
  console.log('Number of stores: ' + stats.stores);
  console.log('Number of cache hits: ' + stats.hits);
  console.log('All statistics: ' + JSON.stringify(stats, null, " "));

  await client.disconnect();
}

test();
