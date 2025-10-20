'use strict';

(function() {

  var _ = require('underscore');
  var f = require('./functional');
  var u = require('./utils');

  var codec = require('./codec');

  var events = require('events');

  module.exports = listeners;

  function listeners(protocol) {
    var logger = u.logger('listeners');
    var listeners = u.keyValueMap();

    function futurePreWrite(transport, ctx, op, body, decoder, opts, preWrite) {
      f.actions(protocol.stepsHeaderBody(ctx, op, body, opts), codec.bytesEncoded)(ctx);
      return transport.writeCommand(ctx, decoder, preWrite);
    }

    function preWriteAddListener(event, listener, listenerId) {
      return function(conn) {
        // Listener needs to be registered in advance since events might come
        // before reply from server to add listener, e.g. when include state
        // is enabled. To avoid leaking listeners, remove listener if there's
        // any problem.
        emitterAddListener(event, listener, listenerId, conn);
      }
    }

    function createEmitter(listenerId, conn, event, callback) {
      var emitter = new events.EventEmitter();
      logger.tracef('Create listener emitter for connection %s and listener with listenerId=%s', conn, listenerId);
      listeners.put(listenerId, {emitter: emitter, conn: conn, event: event, callback: callback});
      return emitter;
    }

    function emitterAddListener(event, callback, listenerId, conn) {
      var l = listeners.get(listenerId);
      var emitter = f.existy(l) ? l.emitter : createEmitter(listenerId, conn, event, callback);
      emitter.addListener(event, callback);
    }

    var listen = {
      removeListeners: function(listenerId) {
        var l = listeners.get(listenerId);
        if (f.existy(l)) {
          l.emitter.removeAllListeners();
          listeners.remove(listenerId);
        }
      },
      findConnectionListener: function(listenerId) {
        var l = listeners.get(listenerId);
        return f.existy(l) ? l.conn : undefined;
      },
      addRemoteListener: function (transport, ctx, event, listener, opts) {
        var listenerId = _.uniqueId('listener_');
        logger.debugl(function() {
          return ['Invoke addListener(msgId=%d,event=%s,listenerId=%s,opts=%s) remotely',
                  ctx.id, event, listenerId, JSON.stringify(opts)]; });

        var encodeListenerAddCommon = protocol.encodeListenerAdd(listenerId, opts)();
        var encodeListenerAddInterests = protocol.encodeListenerInterests(opts);
        var encodeListenerAdd = function() {
          return f.cat(encodeListenerAddCommon, encodeListenerAddInterests);
        };

        var remote = futurePreWrite(transport, ctx, 0x25
          , encodeListenerAdd, protocol.complete(protocol.hasSuccess)
          , opts, preWriteAddListener(event, listener, listenerId));

        return remote
          .then(function(success) {
            return success ? listenerId : protocol.removeListeners(listenerId);
          })
          .catch(function() {
            protocol.removeListeners(listenerId);
          });
      },
      addLocalListener: function (ctx, event, listener, opts) {
        logger.debugl(function() {
          return ['Invoke addListener(msgId=%d,event=%s,opts=%s) locally',
                  ctx.id, event, JSON.stringify(opts)]; });

        return new Promise(function (fulfill) {
          emitterAddListener(event, listener, opts.listenerId);
          fulfill(opts.listenerId);
        });
      },
      dispatchEvent: function(event, listenerId, bytebuf, emitFunc) {
        return function() {
          var l = listeners.get(listenerId);
          if (f.existy(l))
            return emitFunc(event, l.emitter, bytebuf, listenerId);

          logger.error('No emitter exists for listener %s', listenerId);
          return true;
        }
      },
      getListenersAt: function (addr) {
        return _.filter(listeners.values(), function(listener) {
          return _.isEqual(addr, listener.conn.getAddress());
        });
      },
    };
    return listen;
  }

}.call(this));
