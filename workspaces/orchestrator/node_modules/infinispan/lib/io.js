'use strict';

(function() {

  var _ = require('underscore');
  var events = require('events');
  var fs = require('fs');
  var net = require('net');

  var tls = require('tls');
  var util = require('util');

  var f = require('./functional');
  var u = require('./utils');
  var codec = require('./codec');

  module.exports = transport;

  var DEFAULT_CLUSTER_NAME = '___DEFAULT-CLUSTER___';

  function showArrayConnections(conns) {
    return ["[", _.map(conns, function(c) { return c.toString(); }).join(","), "]"].join('');
  }

  var Connection = function(addr, transport, listeners) {
    var id = _.uniqueId('conn_');
    var logger = u.logger(transport.getId() + '_' + id);
    var sock = new net.Socket();
    var replayable = u.replayableBuffer();
    var authDone = false;

    function show() { return u.showAddress(addr); }

    function onConnect(fulfill, conn) {
      return function() {
        logger.debugf('Connected to %s', show());
        fulfill(conn);
      };
    }

    function onError(reject) {
      return function(err) {
        logger.error('Error from %s: %s', show(), err.message);
        reject(err);
        transport.retryRpcs(addr); // retry RPCs in case of error
      };
    }

    function onEnd() {
      logger.debugf('Disconnected from %s', show());
      // TODO: Try retrying on disconnect when socket.end is invoked
      // Can't wrap 'end' event callback in promise when socket end invoked,
      // so retries might happen while puts are happening after a manual switch,
      // which causes races so try to do the retries after invoking socket.end
      // instead and fulfill when those have been retried
      // transport.retryRpcs(addr); // retry RPCs in case of disconnect
    }

    function rewind() {
      logger.tracef("Incomplete response or event, rewind buffer and wait more data");
      replayable.rewind();
    }

    function trim(header, bytebuf) {
      logger.tracef("After decoding request(msgId=%d), buffer size is %d, and offset %d",
                    header.msgId, bytebuf.buf.length, bytebuf.offset);
      replayable.trim(bytebuf);
    }

    function waitTopologyThenCompleteRpc(rpc, header, isError, topology, body) {
      if (header.hasNewTopology) {
        // If new topology is received, rpc needs to be
        // completed after new topology has been installed
        topology.then(function() {
          completeRpc(rpc, header, isError, topology, body);
        })
      } else {
        completeRpc(rpc, header, isError, topology, body);
      }
    }

    function completeRpc(rpc, header, isError, topology, body) {
      logger.tracel(function() { return [
        'Complete %s for request(msgId=%d) with %s',
        isError ? 'failure' : 'success', header.msgId, u.str(body.result)]; });

      if (isError)
        rpc.fail(body.result);
      else
        rpc.success(body.result);

      transport.removeRpc(header.msgId);
    }

    function onData(data) {
      if (!f.existy(replayable))
        replayable = u.replayableBuffer();

      replayable.append(data);
      var canDecodeMore = true;
      var protocol = transport.getProtocol();
      while (!replayable.isEmpty() && canDecodeMore) {
        var bytebuf = replayable.mark();

        var h = protocol.decodeHeader(bytebuf);
        canDecodeMore = h.continue;
        if (canDecodeMore) {
          var header = h.result;
          var topology = header.hasNewTopology
              ? transport.updateTopology(bytebuf)
              : undefined;

          var isTopologyComplete = header.hasNewTopology && f.existy(topology);

          canDecodeMore = !header.hasNewTopology || isTopologyComplete;

          if (canDecodeMore) {
            if (protocol.isEvent(header)) {
              canDecodeMore = protocol.decodeEvent(header, bytebuf, listeners);
            } else {
              if (protocol.isError(header)) {
                canDecodeMore = decodeError(header, bytebuf, topology);
              } else {
                canDecodeMore = decodeRpcBody(header, bytebuf, topology);
              }
            }

            if (!canDecodeMore)
              rewind(); // Incomplete event or body, rewind
            else
              trim(header, bytebuf); // Trim buffer after reading event or body
          } else {
            rewind(); // Incomplete topology, rewind
          }
        } else {
          rewind();  // Incomplete header, rewind
        }
      }

      if (replayable.isEmpty()) // If empty, nullify to avoid leaks
        replayable = null;
    }

    function decodeError(header, bytebuf, topology) {
      var protocol = transport.getProtocol();
      var body = protocol.decodeError(header, bytebuf);
      var canDecodeMore = body.continue;
      if (body.continue) {
        var rpc = transport.findRpc(header.msgId);
        if (f.existy(rpc)) {
          waitTopologyThenCompleteRpc(rpc, header, true, topology, body);
        } else {
          logger.error('Error received but rpc not found for (msgId=%d)', header.msgId);
        }
      }
      return canDecodeMore;
    }

    function decodeRpcBody(header, bytebuf, topology) {
      var protocol = transport.getProtocol();
      var rpc = transport.findRpc(header.msgId);
      if (f.existy(rpc)) {
        var body = protocol.decodeBody(rpc.decoder, header, bytebuf, conn);
        var canDecodeMore = body.continue;
        if (body.continue)
          waitTopologyThenCompleteRpc(rpc, header, false, topology, body);

        return canDecodeMore;
      } else {
        logger.error('Rpc not found for (msgId=%d)', header.msgId);
        return true;
      }
    }

    function sslSocketOpts(sslOpts, reject) {
      var options = {};

      options.ca = _.map(sslOpts.trustCerts, function (cert) {
        return fs.readFileSync(cert);
      });

      options = sslClientAuthOpts(options, sslOpts.clientAuth);
      options = sslCryptoStoreOpts(options, sslOpts.cryptoStore, reject);

      options.secureProtocol = sslOpts.secureProtocol;
      options.servername = sslOpts.sniHostName;

      return options;
    }

    function sslClientAuthOpts(options, authOpts) {
      if (f.existy(authOpts)) {
        options.key = readFileIfExists(authOpts, 'key');
        options.cert = readFileIfExists(authOpts, 'cert');
        options.passphrase = authOpts.passphrase;
      }
      return options;
    }

    function sslCryptoStoreOpts(options, storeOpts, reject) {
      if (f.existy(storeOpts)) {
        if (!f.existy(storeOpts.path))
          reject(new Error('No path defined for crypto store'));

        if (!f.existy(storeOpts.passphrase))
          reject(new Error('No passphrase defined for crypto store'));

        options.pfx = fs.readFileSync(storeOpts.path);
        options.passphrase = storeOpts.passphrase;
      }
      return options;
    }

    function readFileIfExists(parent, opt) {
      return f.existy(parent[opt])
        ? fs.readFileSync(parent[opt])
        : undefined;
    }

    function connectPlainSocket(fulfill, conn) {
      return sock.connect(addr.port, addr.host, onConnect(fulfill, conn));
    }

    function connectSslSocket(fulfill, reject, conn) {
      var sslOpts = transport.sslOpts();
      var options = sslSocketOpts(sslOpts, reject);
      var localSock = tls.connect(addr.port, addr.host, options, function() {
        logger.debugf('Connecting via SSL to %s, socket is %s, server name is: `%s`', show(),
                      localSock.authorized ? 'authorized' : 'unauthorized',
                      localSock.servername);
        fulfill(conn);
      });
      return localSock;
    }

    var conn = {
      connect: function() {
        return new Promise(function (fulfill, reject) {
          logger.debugf('Connecting to %s', show());

          var sslOpts = transport.sslOpts();
          sock = sslOpts.enabled
            ? connectSslSocket(fulfill, reject, conn)
            : connectPlainSocket(fulfill, conn);

          sock.on('error', onError(reject));
          sock.on('end', onEnd);
          sock.on('data', onData);
        });
      },
      disconnect: function() {
        return new Promise(function (fulfill, reject) {
          logger.debugf('Called disconnect on %s', show());
          sock.end();
          fulfill();
        });
      },
      write: function(buffer) {
        return new Promise(function (fulfill, reject) {
          var flushed = sock.write(buffer, (err) => {
            if (err) {
              logger.error('Error writing to socket: %s', err);
              transport.retryRpcs(addr); // retry RPCs in case of error
            }
            fulfill();
          });
          if (!flushed)
            logger.debugf('Buffer write not fully flushed, part of of data queued for: %s',
              buffer.toString('hex').toUpperCase());
        });

      },
      getAddress: function() {
        return addr;
      },
      toString: function() {
        return show() + '@' + id;
      }
    };
    return conn;
  };

  var ConsistentHashRouter = function(logger, topologyId, conns, segments, clusterName) {
    var i = 0;
    var mh3 = u.murmurHash3();

    function filterNot(addrs) {
      var missing = _.filter(conns, function(c) {
        return !_.where(addrs, c.getAddress()).length > 0;
      });
      logger.debugl(function() {
        return ['Removed servers are: %s', showArrayConnections(missing)]; });
      return missing;
    }

    function getConnectionRoundRobin() {
      var conn = conns[i++];
      if (i >= conns.length) i = 0;
      return conn;
    }

    function findConnectionUntried(triedAddrs) {
      return _.find(conns, function(c) {
        return !_.contains(triedAddrs, c.getAddress());
      });
    }

    function getSegmentSize(numSegments) {
      return Math.abs(Math.ceil((1 << 31) / numSegments));
    }

    function getNormalizedHash(buf) {
      // make sure no negative numbers are involved.
      var hash = mh3.hash(buf);
      return hash & 0x7FFFFFFF;
    }

    function keyToBytes(k, protocol) {
      var ctx = u.context(32);
      f.actions([protocol.encodeMediaKey(k)], codec.bytesEncoded)(ctx);
      return f.actions([codec.decodeVariableBytes()], codec.lastDecoded)({buf: ctx.buf, offset: 0});
    }

    function addrToConn(addr) {
      return _.find(conns, function(con) {
        return _.isEqual(con.getAddress(), addr);
      });
    }

    return {
      getTopologyId: function() { return topologyId; },
      getConnection: function(k, protocol) {
        return f.existy(k)
            ? addrToConn(this.findOwners(k, protocol)[0])
            : getConnectionRoundRobin();
      },
      findConnection: function(triedAddrs) {
        return findConnectionUntried(triedAddrs);
      },
      getAddresses: function() {
        return _.map(conns, function (conn) { return conn.getAddress(); });
      },
      filter: function(addrs) {
        return _.filter(conns, function(conn) {
          return _.where(addrs, conn.getAddress()).length > 0;
        });
      },
      getMissingConnections: function(topology) {
        return filterNot(topology.servers);
      },
      disconnect: function(missing) {
        var connections = f.existy(missing) ? missing : conns;
        logger.debugf('Disconnect all router connections: %s', showArrayConnections(connections));
        var disconnects = _.map(connections, function(c) { return c.disconnect(); });
        return Promise.all(disconnects);
      },
      findOwners: function(k, protocol) {
        var keyBytes = keyToBytes(k, protocol);
        var segmentSize = getSegmentSize(segments.length);
        var hash = getNormalizedHash(keyBytes);
        var segmentId = Math.floor(hash / segmentSize);
        return segments[segmentId];
      },
      getClusterName: function() { return clusterName; },
      toString: function() {
        return util.format('ConsistentHashRouter(conns=%s)', showArrayConnections(conns));
      }
    }
  };

  var FixedRouter = function(logger, conn, clusterName) {
    function isMemberMissing(addrs) {
      return _.isEmpty(_.find(addrs, function(addr) {
        return _.isMatch(addr, conn.getAddress());
      }));
    }

    return {
      getTopologyId: function() { return 0; },
      getConnection: function() {
        return conn;
        },
      findConnection: function(triedAddrs) {
        return _.contains(triedAddrs, conn.getAddress()) ? undefined : conn;
      },
      getAddresses: function() { return [conn.getAddress()]; },
      filter: function(addrs) {
        var found = _.find(addrs, function(addr) {
          return _.isEqual(addr, conn.getAddress());
        });
        return _.isEmpty(found) ? [] : [conn];
      },
      getMissingConnections: function(topology) {
        var addrs = topology.servers;
        var isMissing = isMemberMissing(addrs);
        return isMissing ? [conn] : [];
      },
      disconnect: function(missing) {
        if (f.existy(missing)) {
          var isMissing = !_.isEmpty(missing);
          if (isMissing) {
            logger.debugf('Removed server is: %s', conn.toString());
            return conn.disconnect()
          } else {
            logger.debugf('Removed server: none');
            return Promise.resolve();
          }
        } else {
          logger.debugf('Disconnect single connection: %s', conn.toString());
          return conn.disconnect();
        }
      },
      findOwners: function() { return [conn]; },
      getClusterName: function() { return clusterName; },
      toString: function() {
        return util.format('FixedRouter(conn=%s)', conn.toString());
      }
    }
  };

  function transport(addrs, protocol, clientOpts, listeners) {
    var id = _.uniqueId('io_');
    var logger = u.logger(id);
    var rpcMap = u.keyValueMap();
    var emitter = new events.EventEmitter();
    var router;
    var clusters = f.cat(clientOpts.clusters,
                    [{ name: DEFAULT_CLUSTER_NAME, servers: addrs}]);
    var clusterSwitchInProgress = false;

    function onRouter(r) {
      // Check if a different router has been installed as result of cluster switch
      var isRetryAll = f.existy(router)
        && !_.isEqual(router.getClusterName(), r.getClusterName());

      // var oldRouter = router;
      router = r; // Assign new router
      logger.debugf("New router installed: %s", r.toString());

      if (isRetryAll) {
        logger.debugf("Retry all after new router installed %s", r.toString());
        retryAll(); // If cluster switched happened, retry all rpcs
        clusterSwitchInProgress = false;
      }

      // if (f.existy(oldRouter)) {
      //  // Disconnect old router to avoid leaving lingering connections
      //  logger.debugf("Disconnect old router connections");
      //  oldRouter.disconnect();
      // }
    }

    function retryAll() {
      _.each(rpcMap.values(), function(rpc) {
        rpc.ctx.triedAddrs = [];
        logger.tracef('Retrying request(msgId=%d) after cluster switch', rpc.ctx.id);

        var conn = router.getConnection();
        if (f.existy(conn))
          writeRetry(rpc.ctx, rpc.decoder, conn, rpc.success, rpc.fail);
      });
    }

    function filterAdded(topology) {
      var currentAddrs = router.getAddresses();
      var added = _.filter(topology.servers, function(a) {
        return !_.where(currentAddrs, a).length > 0;
      });
      logger.debugl(function() {
        return ['Added servers: %s', u.showArrayAddress(added)]; });
      return added;
    }

    function filterConnected(topology) {
      var connected = _.filter(router.getAddresses(), function(addr) {
        return _.where(topology.servers, addr).length > 0;
      });
      logger.debugl(function() {
        return ['Connected servers: %s', u.showArrayAddress(connected)]; });
      return connected;
    }

    function write(ctx, decoder, connFunc, preWrite) {
      return new Promise(function (fulfill, reject) {
        var conn = connFunc();
        if (f.existy(preWrite))
          preWrite(conn);

        logger.tracel(function() {
          return ['Write buffer(msgId=%d) to %s: %s'
            , ctx.id, conn.toString(), ctx.buf.toString('hex').toUpperCase()]; });

        rpcMap.put(ctx.id, {success: fulfill, fail: reject,
          decoder: decoder, address: conn.getAddress(), ctx: ctx});
        conn.write(ctx.buf);
      });
    }

    function writeRetry(ctx, decoder, conn, fulfill, reject) {
      logger.tracel(function() {
        return ['Write retried buffer(msgId=%d) to %s: %s'
          , ctx.id, conn.toString(), ctx.buf.toString('hex').toUpperCase()]; });

      rpcMap.put(ctx.id, {success: fulfill, fail: reject,
        decoder: decoder, address: conn.getAddress(), ctx: ctx});
      conn.write(ctx.buf);
    }

    function disconnectAndEmitRouter(newRouter) {
      if (f.existy(router)) {
        // Disconnect existing router connections
        // and regardless of outcome, install new router
        router.disconnect().finally(function() {
          onRouter(newRouter);
        })
      } else {
        onRouter(newRouter);
      }
    }

    function installNewTopology(topology, transport) {
      var newAddrs = topology.servers;
      logger.debugl(function() {return [
        'New topology(id=%s) discovered: %s',
        topology.id, u.showArrayAddress(newAddrs)] });

      // Disconnect connections for members not present in topology
      var missing = router.getMissingConnections(topology);
      var disconnectMany = router.disconnect(missing);
      // Filter new addresses for which connections need to be created
      var added = filterAdded(topology);
      // Filter connections which continue connected
      var connected = filterConnected(topology);

      // Then, create new connections for all added members
      var newConnected = disconnectMany.then(function () {
        return Promise.all(_.map(added, function (addr) {
          return new Connection(addr, transport, listeners);
        }));
      });
      // Then, join these with the connected members and install new router
      return newConnected
        .then(function (newConnects) {
          var cons = f.cat(router.filter(connected), newConnects);
          var newRouter = new ConsistentHashRouter(
            logger, topology.id, cons, topology.segments, router.getClusterName());
          onRouter(newRouter);
          return newConnects;
        }).then(function (conns) {
            return Promise.all(_.map(conns, function (conn) {
              return conn.connect().then(function() {
                if(transport.authOpts().enabled) {
                  return authMech(transport, conn, topology.id)
                      .then(function (authMechs) {
                        return auth(transport, conn, topology.id).then(function () {
                          return conn;
                        });
                  });
                } else {
                  return ping(transport, conn, topology.id).then(function () {
                    return conn;
                  });
                }
              })
            }));
          })
          .then(failoverListeners(transport, missing));
    }

    function failoverListeners(transport, missing) {
      return function() {
        logger.debugf("Failover listeners registered in: %s", showArrayConnections(missing));

        var failover = _.map(missing, function(c) {
          var listenersAt = listeners.getListenersAt(c.getAddress());

          return _.map(listenersAt, function(listener) {
            logger.debugf("Failover listener with id: %s", listener.id);
            listeners.removeListeners(listener.id);
            return listeners.addRemoteListener(transport, transport.context(32), listener.event, listener.callback);
          });
        });

        return Promise.all(_.flatten(failover));
      }
    }

    function toLazyConnectionsFirstCall(servers, connF, transport) {
      return _.map(servers, function(server) {
        return function() {
          var conn = new Connection(server, transport, listeners);
          onRouter(new FixedRouter(logger, conn, DEFAULT_CLUSTER_NAME));
          return connF(conn);
        };
      });
    }

    function toLazyConnections(servers, connF, transport) {
      return _.map(servers, function(server) {
        return function() {
          var conn = new Connection(server, transport, listeners);
          return connF(conn);
        };
      });
    }

    function getCandidateClusters(failedClusterName) {
      return _.filter(clusters, function(cluster) {
        return !_.isEqual(cluster.name, failedClusterName);
      });
    }

    function getFailoverMainRouter(failedClusterName) {
      return function(connInfo) {
        logger.debugf('Switched from failed cluster=%s to cluster=%s',
                      failedClusterName, connInfo[0]);
        disconnectAndEmitRouter(new FixedRouter(logger, connInfo[1], connInfo[0]));
        return true;
      }
    }

    function altConnection(clusterName) {
      return function(conn) {
        logger.debugf('Alt connection %s', clusterName);
        return Promise.all([Promise.resolve(clusterName), conn.connect()
            .then(function () {
              if(o.authOpts().enabled) {
                return auth(o, conn, o.getTopologyId()).then(function () {
                  logger.debugf('Alt connection, return conn %s', conn.toString());
                  return conn;
                });
              }
              return conn;
        })]);
      }
    }

    function toLazyAltConnections(cluster, transport) {
      return toLazyConnections(
        cluster.servers, altConnection(cluster.name), transport);
    }

    function aroundClusterSwitch(clusterSwitchF, clusterFailF) {
      logger.debugf('aroundClusterSwitch set clusterSwitchInProgress=true');
      clusterSwitchInProgress = true;
      return clusterSwitchF()
          .catch(function(err) {
            logger.error('error in aroundClusterSwitch %s', err.message);
            if (f.existy(clusterFailF)) clusterFailF(err);
          }).finally(function () {
            logger.tracef('aroundClusterSwitch finally, set clusterSwitchInProgress=false');
            clusterSwitchInProgress = false;
          });
    }

    function trySwitchCluster(noClustersF, clusterFailF, transport) {
      var failedClusterName = router.getClusterName();
      logger.debugf('Try to failover away from cluster=%s', failedClusterName);
      if (_.isEmpty(clientOpts.clusters)) {
        logger.tracef('No alternative clusters configured');
        return new Promise(function() { noClustersF(); });
      } else {
        return aroundClusterSwitch(function() {
          var clusters = getCandidateClusters(failedClusterName);
          var allLazyConns = _.flatten(f.cat(_.map(clusters, function(cluster) {
            logger.tracef('Try to move to cluster %s', cluster.name);
            return toLazyAltConnections(cluster, transport);
          })));
          logger.tracef('allLazyConns here, now find first connection');
          return findFirstConnection(allLazyConns, getFailoverMainRouter(failedClusterName));
        }, clusterFailF);
      }
    }

    function getManualMainRouter(connInfo) {
      var clusterName = connInfo[0];
      var conn = connInfo[1];
      logger.debugf('Manually switched to cluster=%s, establishing connection to %s',
                    clusterName, conn.toString());
      disconnectAndEmitRouter(new FixedRouter(logger, conn, clusterName));
      return true; // cluster switched
    }

    function findManualSwitchCluster(clusterName) {
      var name = f.existy(clusterName) ? clusterName : DEFAULT_CLUSTER_NAME;
      return _.find(clusters, function(cluster) {
        return _.isEqual(cluster.name, name);
      });
    }

    function tryManualSwitchCluster(clusterName, transport) {
      logger.debugf('Try to manually switch to cluster=%s', clusterName);
      var targetCluster = findManualSwitchCluster(clusterName);
      if (!f.existy(targetCluster)) {
        logger.debugf('No cluster found for cluster=%s', clusterName);
        return Promise.resolve(false);
      }

      return aroundClusterSwitch(function() {
        var lazyConns = toLazyAltConnections(targetCluster, transport);
        return findFirstConnection(lazyConns, getManualMainRouter);
      }, function () {
        logger.error('Unable to switch to cluster %s', targetCluster.name);
        return Promise.resolve(false);
      })
    }

    function mainConnection(conn) {
      if (o.authOpts().enabled) {
        return conn.connect().then(function () {
          return authMech(o, conn, o.getTopologyId());
        }).then(function (authMechs) {
          logger.tracef(authMechs);
          if (!_.contains(authMechs, o.authOpts().saslMechanism)) {
            throw new Error('The selected authentication mechanism ' + o.authOpts().saslMechanism
                            + ' is not among the supported server mechanisms: ' + authMechs);
          }
          return auth(o, conn, o.getTopologyId());
        }).then(conn);
      }

      return conn.connect().then(function () {
        return ping(o, conn,  o.getTopologyId());
      }).then(conn);
    }

    function getFirstConnection(lazyConns) {
      return _.foldl(lazyConns, function(state, f) {
        return state
            .catch(function() { return f(); } ) // if fails, try next
      }, Promise.reject(new Error('Unable to find the first connection')));
    }

    function findFirstConnection(lazyConns, connF) {
      logger.debugf('Call findFirstConnection');

      return _.foldl(lazyConns, function(state, f) {
        return state
          .catch(function() { return f(); } ) // if fails, try next
          .then(connF);
      }, Promise.reject(new Error('Unable to find a connection')));
    }

    function getMainRouter(conn) {
      disconnectAndEmitRouter(new FixedRouter(logger, conn, DEFAULT_CLUSTER_NAME));
    }

    function ping(transport, conn, topologyId) {
      var ctx = u.context(16);
      ctx.topologyId = topologyId;
      logger.debugf('Invoke ping(msgId=%d)', ctx.id);
      var p = transport.getProtocol();
      f.actions(p.stepsHeader(ctx, 0x17, undefined), codec.bytesEncoded)(ctx);
      return transport.writeCommandPinned(ctx, p.decodePingResponse, conn);
    }

    function auth(transport, conn, topologyId) {
      if (!transport.authOpts().enabled || conn.authDone) {
        logger.debugf('Auth not enabled');
        return Promise.resolve(conn);
      }
      conn.authDone = true;
      var ctx = u.context(16);
      ctx.topologyId = topologyId;
      var p = transport.getProtocol();
      logger.debugf('Invoke auth(msgId=%d)', ctx.id);
      var holder = {};
      f.actions(p.stepsHeaderBody(ctx, 0x23, p.sasl(transport.authOpts(), holder), undefined), codec.bytesEncoded)(ctx);
      var result = transport.writeCommandPinned(ctx, p.decodeSasl, conn);
      return result.then(function (r) {
        ctx = u.context(16);
        ctx.topologyId = topologyId;
        holder.challenge = r.response;
        f.actions(p.stepsHeaderBody(ctx, 0x23, p.sasl(transport.authOpts(), holder) , undefined), codec.bytesEncoded)(ctx);
        return transport.writeCommandPinned(ctx, p.decodeSasl, conn).then(function (r) {
          return r;
        });
        return r;
      });
    }

    function authMech(transport, conn, topologyId) {
      if (!transport.authOpts().enabled) {
        logger.debugf('Auth not enabled');
        return Promise.resolve();
      }
      var ctx = u.context(16);
      ctx.topologyId = topologyId;
      var p = transport.getProtocol();
      logger.debugf('Invoke authMech(msgId=%d)', ctx.id);
      f.actions(p.stepsHeader(ctx, 0x21, undefined), codec.bytesEncoded)(ctx);
      return transport.writeCommandPinned(ctx, p.decodeAuthMech, conn);
    }

    var o = {
      connect: function() {
        // Convert to lazy connections
        var lazyConns = toLazyConnectionsFirstCall(addrs, mainConnection, o);

        // Set up router event callback
        emitter.on('router', onRouter);

        // Fold over the lazy connections, only triggering connections if failure
        return getFirstConnection(lazyConns);
      },
      getConnection: function(key) {
        return router.getConnection(key, protocol);
      },
      disconnect: function() {
        emitter.removeListener('router', onRouter);
        if (f.existy(router)) {
            logger.debugf('Disconnect transport');
            return router.disconnect();
        } else {
          return Promise.resolve();
        }
      },
      writeKeyCommand: function(ctx, key, decoder) {
        return write(ctx, decoder, function() { return router.getConnection(key, protocol); });
      },
      writeCommand: function(ctx, decoder, preWrite) {
        return write(ctx, decoder, function() { return router.getConnection(); }, preWrite);
      },
      writeCommandPinned: function(ctx, decoder, conn) {
        return write(ctx, decoder, function() { return conn; });
      },
      writeRetry: function(ctx, decoder, fulfill, reject, triedAddrs) {
        var conn = router.findConnection(triedAddrs);
        if (f.existy(conn))
          writeRetry(ctx, decoder, conn, fulfill, reject);
        else {
          trySwitchCluster(
            function() { reject('No clusters and no connections left to try on writeRetry.') },
            function(err) {
              logger.tracef('Clusters configured but none available on writeRetry: %s', err.message);
              reject('Clusters configured but none available on writeRetry. No connections left to try');
            }, o);
        }
      },
      getProtocol: function() { return protocol; },
      findRpc: function(id) { return rpcMap.get(id); },
      removeRpc: function(id) { return rpcMap.remove(id); },
      updateTopology: function(bytebuf) {
        var topology = protocol.decodeTopology(bytebuf);
        if (topology.done && !_.isEqual(topology.id, router.getTopologyId())) {
          return installNewTopology(topology, o);
        }
        return topology.done ? Promise.resolve() : undefined;
      },
      getTopologyId: function() {
        return router.getTopologyId();
      },
      getMembers: function() {
        return router.getAddresses();
      },
      findOwners: function(k) {
        return router.findOwners(k, protocol);
      },
      retryRpcs: function(addr) {
        if (!clusterSwitchInProgress) {
          var pendingRpcs = rpcMap.filter(
            function(rpc) { return _.isEqual(rpc.address, addr); });

          logger.tracel(function() {
            return ['Pending request ids are: [%s]', _.keys(pendingRpcs)] });

          _.each(pendingRpcs, function(rpc, id) {
            if (rpc.ctx.triedAddrs.length >= clientOpts.maxRetries) {
              trySwitchCluster(
                function() {
                  rpc.fail(util.format(
                    'Unable to complete request(msgId=%d) after trying in %s',
                    id, u.showArrayAddress(rpc.ctx.triedAddrs)));
                },
                function(err) {
                  // Clusters configured but none available
                  logger.tracef('Clusters configured but none available in retryPrcs: %s', err.message);
                  rpc.fail(util.format(
                    'Unable to complete request(msgId=%d) after trying in %s and trying to switch clusters',
                    id, u.showArrayAddress(rpc.ctx.triedAddrs)));
                }, o);
            } else {
              rpc.ctx.triedAddrs.push(addr); // Add tried address
              logger.tracef('Retrying request(msgId=%d), retry %d', id, rpc.ctx.triedAddrs.length);
              o.writeRetry(rpc.ctx, rpc.decoder, rpc.success, rpc.fail, rpc.ctx.triedAddrs);
            }
          })
        } else {
          logger.debugf('Do not retry RPCs since cluster switch is in progress');
        }
      },
      sslOpts: function() {
        return clientOpts.ssl;
      },
      authOpts: function() {
        return clientOpts.authentication;
      },
      switchToCluster: function(clusterName) {
        return tryManualSwitchCluster(clusterName, o);
      },
      switchToDefaultCluster: function() {
        return tryManualSwitchCluster(DEFAULT_CLUSTER_NAME, o);
      },
      toString: function() {
        return util.format('id=%s,router=%s', id, router);
      },
      getId: function() {
        return id;
      },
      context: function(size) {
        var ctx = u.context(size);
        ctx.topologyId = this.getTopologyId();
        return ctx;
      }
    };
    return o;
  }

}.call(this));
