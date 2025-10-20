var _ = require('underscore');

var t = require('./utils/testing'); // Testing dependency

describe('Infinispan clustered clients', function() {
  t.configureLogging();

  it('can failover when nodes crash', function(done) {
    var keys = ['before-failover-listener', 'middle-failover-listener', 'after-failover-listener'];
    t.launchClusterNodeAndWaitView('server-failover-one', t.failoverConfig, t.failover1['port'], t.failoverMCastAddr, 1, t.client)
       .then(function() {
         return t.client(t.failover1, t.authOpts);
       })
      .then(t.assert(t.getMembers(), t.toContain([t.failover1])))
      .then(t.assert(t.clear()))
      .then(t.on('create', t.expectEvents(keys, done, true)))
      .then(t.assert(t.putIfAbsent(keys[0], 'value'), t.toBeTruthy))
      .then(function(client) {return t.launchClusterNodeAndWaitView('server-failover-two', t.failoverConfig, t.failover2['port'], t.failoverMCastAddr, 2, client);}) //11432
      .then(expectClientView([t.failover1, t.failover2]))
      .then(t.assert(t.putIfAbsent(keys[1], 'value'), t.toBeTruthy))
      .then(withAll(t.stopAndWaitView(t.failover1['port'], 1, t.failover2['port'])))
      .then(expectClientView([t.failover2]))
      .then(t.assert(t.putIfAbsent(keys[2], 'value'), t.toBeTruthy))
      .then(withAll(t.stopClusterNode(t.failover2['port'], true)))
      .then(withAll(t.disconnect()))
      .catch(t.failed(done));
  }, 10000);

});

function withAll(fun) {
  return function(param) {
    return fun(param).then(function() { return param; })
  }
}

function keyPut(value) {
  return function(params) { return params[0].put(params[1], value) }
}

function keyGet(expectFun) {
  return function(params) {
    return params[0].get(params[1]).then(function(v) { expectFun(v); })
  }
}

function expectClientView(members) {
  return function(client) {
    return t.assert(t.ping(), t.toBeUndefined)(client)
      .then(t.assert(t.getMembers(), t.toContain(members)))
  }
}
