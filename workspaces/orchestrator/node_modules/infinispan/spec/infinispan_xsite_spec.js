var _ = require('underscore');

var t = require('./utils/testing'); // Testing dependency
var u = require('../lib/utils');

var logger = u.logger('xsite-test');

describe('Infinispan xsite cluster client', function() {

  // Since Jasmine 1.3 does not have beforeAll callback, execute
  // any cleanup as first test so that it only gets executed once.
  it('start sites', function(done) {
      logger.debugf("Starting servers for xsite replication tests.");
      t.launchClusterNodeAndWaitView('server-earth', t.earth1Config, t.earth1['port'], t.earth1MCastAddr, 1, t.client)
          .then(function(client) {return t.launchClusterNodeAndWaitView('server-moon', t.moon1Config, t.moon1['port'], t.moon1MCastAddr, 1, client);})
          .then(function () {
            logger.debugf("Both moon and earth servers started");
          }).catch(t.failed(done)).finally(done);
  }, 15000);

  it('can manually switch and fail over sites', function(done) {
    siteClients().then(function(cs) {
      expect(cs[0].getTopologyInfo().getMembers()).toEqual([t.earth1]);
      expect(cs[1].getTopologyInfo().getMembers()).toEqual([t.moon1]);
      return cs[0].getTopologyInfo().switchToCluster('server-moon')
        .then(function() {
          expect(cs[0].getTopologyInfo().getMembers()).toEqual([t.moon1]);
          return cs[0].getTopologyInfo().switchToDefaultCluster();
        })
        .then(function() {
          expect(cs[0].getTopologyInfo().getMembers()).toEqual([t.earth1]);
          return cs[0].put('xsite-key', 'xsite-value');
        })
        .then(assertGet('xsite-key', 'xsite-value', cs[0]))
        .then(assertGet('xsite-key', 'xsite-value', cs[1]))
        .then(t.stopClusterNode(t.earth1['port'], true))
        // Client connected to surviving site should find data
        .then(assertGet('xsite-key', 'xsite-value', cs[1]))
        // Client connected to crashed site should failover
        .then(assertGet('xsite-key', 'xsite-value', cs[0]))
        .then(function() {
          expect(cs[0].getTopologyInfo().getMembers()).toEqual([t.moon1]);
          expect(cs[1].getTopologyInfo().getMembers()).toEqual([t.moon1]);
        })
        // Re-launch site stopped site and stop alive site
        .then(assertGet('xsite-key', 'xsite-value', cs[0]))
        .then(function(client) { return t.launchClusterNodeAndWaitView('server-earth', t.earth1Config, t.earth1['port'], t.earth1MCastAddr, 1, client); })
        .then(t.stopClusterNode(t.moon1['port'], true))
        // Client connected to failed over site should come back to original site
        .then(assertGet('xsite-key', undefined, cs[0]))
        .then(function() {
          expect(cs[0].getTopologyInfo().getMembers()).toEqual([t.earth1]);
        })
        .then(function() {
          return cs[0].put('xsite-key-2', 'xsite-value-2');
        })
        .then(assertGet('xsite-key-2', 'xsite-value-2', cs[0]))
          //Stopping the rest of the servers to finish the test
        .then(t.stopClusterNode(t.earth1['port'], true))
        .finally(function() {
          return Promise.all(_.map(cs, function(c) { return c.disconnect(); }));
        });
    })
    .catch(t.failed(done)).finally(done);
  }, 15000);

});

function assertGet(k, expected, client) {
  return function() {
    return client.get(k)
      .then(function(v) {
        expect(v).toBe(expected);
      })
  }
}

function clusterSiteMoon() {
  return {
    cacheName: t.xsiteCacheName,
    authentication: t.authOpts.authentication,
    clusters: [
      {
        name: 'server-moon',
        servers: [t.moon1]
      }
    ]
  };
}

function siteClients() {
  return Promise.all([
    t.client(t.earth1, clusterSiteMoon()),
    t.client(t.moon1, {cacheName:
      t.xsiteCacheName,
      authentication: t.authOpts.authentication
    })
  ]);
}
