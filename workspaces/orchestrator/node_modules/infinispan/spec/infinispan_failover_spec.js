var t = require('./utils/testing'); // Testing dependency

describe('Infinispan clustered clients', function() {

  it('can failover when nodes crash', function(done) {
      t.launchClusterNodeAndWaitView('server-failover-one', t.failoverConfig, t.failover1['port'], t.failoverMCastAddr, 1)
          .then(function() {
              return t.client(t.failover1,  t.authOpts);
          })
          .then(t.assert(t.getMembers(), t.toContain([t.failover1])))
          .then(function(client) {
            return t.launchClusterNodeAndWaitView('server-failover-two', t.failoverConfig, t.failover2['port'], t.failoverMCastAddr,  2, client);}) //11432
          .then(expectClientView([t.failover1, t.failover2]))
          .then(function(client) { return t.launchClusterNodeAndWaitView('server-failover-three', t.failoverConfig, t.failover3['port'], t.failoverMCastAddr, 3, client); }) //11442
          .then(expectClientView([t.failover1, t.failover2, t.failover3]))
          .then(keyGen([t.failover2, t.failover3]))
          .then(withAll(keyPut('failover-value')))
          .then(withAll(keyGet(t.toBe('failover-value'))))
          .then(withFirst(t.stopAndWaitView(t.failover3['port'], 2, t.failover1['port'])))
          .then(withFirst(expectClientView([t.failover1, t.failover2])))
          .then(withAll(keyGet(t.toBe('failover-value'))))
          .then(withFirst(t.stopAndWaitView(t.failover2['port'], 1, t.failover1['port'])))
          .then(withFirst(expectClientView([t.failover1])))
          .then(withAll(keyGet(t.toBe('failover-value'))))
          .then(withFirst(t.stopClusterNode(t.failover1['port'], false)))
          .then(withFirst(t.disconnect()))
          .catch(t.failed(done)).finally(done);
  }, 20000);

});

function keyGen(addrs) {
  return function(cl) { return [cl, t.findKeyForServers(cl, addrs)]; }
}

function withFirst(fun) {
  return function(params) {
    return fun(params[0]).then(function() { return params; })
  }
}

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
