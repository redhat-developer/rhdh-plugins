# Hot Rod JS Client

`infinispan` is an asynchronous event-driven Infinispan client for Node.js.
The results of the asynchronous operations are represented using
[Promise](https://www.promisejs.org) instances. Amongst many advantages,
promises make it easy to transform/chain multiple asynchronous invocations
and they improve error handling by making it easy to centralise it.

The client is under heavy development but here's a summary of its
current capabilities:

* `infinispan` client can be constructed with a single server address or
multiple servers addresses. When passing multiple addresses, it will iterate
until it finds a server to which it can connect to.
* Clients can interact with a named cache whose name is passed on client
construction via `{cacheName: 'myCache'}` option. In the absence of any cache
name options, the client will interact with the default cache.
* Full CRUD operation support, e.g. `put`, `get`, `remove`, `containsKey`...etc.
* Compare-And-Swap operation support, e.g. `putIfAbsent`,
`getWithMetadata`, `replace`, `replaceWithVersion`,
`removeWithVersion`..etc.
* Expiration with absolute lifespan or relative maximum idle time
is supported. This expiration parameters as passed as optional parameters
to create/update methods and they support multiple time units, e.g.
`{lifespan: '1m', maxIdle: '1d'}`.
* Update and remove operations can optionally return previous values
by passing in `{previous: true}` option.
* Bulk store/retrieve/delete operations are supported, e.g. `putAll`, `getAll`,
`clear`...etc.
* Cache contents can be iterated over using the `iterator` method.
* Cache size can be determined using the `size` method.
* Remote cache listeners can be plugged using the `addListener` method, which
takes the event type (`create`, `modify`, `remove` or `expiry`) and the
function callback as parameter.
* Clients can store scripts using `addScript` and then they can be remotely
executed using the `execute` operation. Executing a script remotely
optionally takes per-invocation parameters.
* Server-side statistics can be retrieved using the `stats` operation.
* Clients can connect using encryption with the server via SSL/TLS with optional TLS/SNI support.
* Clients can talk to clusters of Infinispan Server instances, using
Consistent-Hash based algorithms to route key-based operations.
* Multi-key or key-less operations are routed in round-robin fashion.
* Clients only need to be configure with a single node's address and from
that node the rest of the cluster topology can be discovered. As nodes are
added or destroyed, clients get notified of changes in the cluster topology
dynamically.
* Clients can talk to multiple clusters that are separated into different site clusters.
The client is normally connected to one of the sites, but if its members fail to respond, it will automatically switch to an alternative site to which it can connect.
* Clients have methods, such as `switchToCluster(clusterName)` and `switchToDefaultCluster` that allows users to manually change to which site cluster to connect.
* Finally, clients can stop communication with the server(s) using the
`disconnect` method.

# Hot Rod JS client documentation

Find installation, configuration, and example usage in the Hot Rod JS Client Guide at [infinispan.org/documentation](https://infinispan.org/documentation/).

You can also build the Hot Rod JS Client Guide as follows:

1. Clone the source repository.
```bash
$ git clone git@github.com:infinispan/js-client.git
```

2. Build the HTML from the asciidoc source.
```bash
$ asciidoctor documentation/asciidoc/titles/js_client.asciidoc
```

3. Open `documentation/asciidoc/titles/js_client.html` in any browser.

# API docs

Review [Hot Rod JS client API documentation](http://docs.jboss.org/infinispan/hotrod-clients/javascript/1.0/apidocs/module-infinispan.html).

You can also build API docs from the source repository as follows:

1. Generate JSDoc formatted API docs.
```bash
$ npm install jsdoc
$ ./node_modules/.bin/jsdoc lib/*.js
```

2. Open `open out/index.html` in any browser.

# Testing

Before executing any tests, Infinispan Server instances need to be started
up so that testsuite can run against those. To ease this process, a script
has been created in the root directory to start all the expected server
instances.

Go to the root of the repo and execute:

```bash
$ npm install
```

Next, start the Infinispan Servers via:

```bash
$ ./run-server.sh
```

To run the testsuite once execute:

```bash
$ ./run-testsuite.sh
```

To run tests continuously execute:

```bash
$ ./node_modules/.bin/jasmine-node spec --autotest --watch lib --captureExceptions
```

To run individual tests execute:

```bash
$ node node_modules/jasmine-node/lib/jasmine-node/cli.js spec/infinispan_local_spec.js --captureExceptions
```

To help with testing, you can quickly run the smoke tests via:

```bash
$ ./smoke-tests.sh
```

Both testsuite and smoke tests can be run with older protocol versions, e.g.

```bash
$ protocol=2.5 ./smoke-tests.sh
```

## Note for Mac Users:
You might experience MPING issues running an Infinispan cluster.

```bash
13:37:15,561 ERROR (jgroups-5,server-two) [org.jgroups.protocols.MPING]
```

If you run into the errors above, add the following to the routes of your host

```bash
sudo route add -net 224.0.0.0/5 127.0.0.1
sudo route add -net 232.0.0.0/5 192.168.1.3
```

# Manual stress tests

The testsuite now contains manual stress tests that take several minutes to run.
To run these tests, execute:

    $ ./node_modules/.bin/jasmine-node spec-manual --captureExceptions


# Memory profiling

The source code comes with some programs that allow the client's memory consumption to be profiled.
Those programs rely on having access to the global garbage collector.
So, to run them you must pass `--expose-gc` command line parameter.
Example:

```bash
node --expose-gc memory-profiling/infinispan_memory_many_get.js
```

So of programs might only report the memory usage before/after.
Others might generate heap dumps which can be visualized using Google Chrome.
Within Chrome, the Developer Tools UI contains a `Memory` tab where heap dumps can be loaded.


# Debugging

To debug tests with IDE:

    node --inspect-brk node_modules/jasmine-node/lib/jasmine-node/cli.js spec/codec_spec.js

Or:

    node --inspect-brk node_modules/jasmine-node/lib/jasmine-node/cli.js spec/infinispan_local_spec.js

And then start a remote Node.js debugger from IDE on port 9229.

# Tests, servers and ports

Here's some more detailed information on which tests interact with which servers and on which ports.
On top of that, you can find information on which tests are always running as opposed to those that are started (and stopped) by the tests themselves.

| Test          | Server Profile  | Ports (Auto/Manual)                     |
| :------------ | :-------------: | :-------------------------------------- |
| local spec    | local           | `11222` (A)                             |
| expiry spec   | local           | `11222` (A)                             |
| cluster spec  | clustered       | `11322` (A), `11332` (A), `11342` (A)   |
| failover spec | clustered       | `11422` (M), `11432` (M), `11442` (M)   |
| ssl spec      | local           | `11232` (A), `12242` (A), `12252` (A)   |
| xsite spec    | earth, moon     | `11522` (earth, M), `11532` (moon, M)   |

# Reporting an issue

This project does not use Github issues.
Instead, please report them via JIRA (project [HRJS](https://issues.jboss.org/projects/HRJS/summary)).
