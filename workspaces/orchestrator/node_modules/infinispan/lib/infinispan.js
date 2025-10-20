/**
 * Infinispan module.
 * @module
 */

'use strict';

(function() {

  var _ = require('underscore');
  var util = require('util');

  var f = require('./functional');
  var codec = require('./codec');
  var u = require('./utils');
  var protocols = require('./protocols');
  var io = require('./io');
  var listeners = require('./listeners');

  var Client = function(addrs, clientOpts) {
    var logger = u.logger('client');

    function protocolResolver(version) {
      logger.debugf('Using protocol version: %s', version);

      switch (version) {
        case '3.0': return protocols.version30(clientOpts);
        case '2.9': return protocols.version29(clientOpts);
        case '2.5': return protocols.version25(clientOpts);
        case '2.2': return protocols.version22(clientOpts);
        default : throw new Error('Unknown protocol version: ' + version);
      }
    }

    var p = protocolResolver(clientOpts['version']);
    var listen = listeners(p);

    var TINY = 16, SMALL = 32, MEDIUM = 64, BIG = 128;

    var transport = io(addrs, p, clientOpts, listen);
    var events = ['create', 'modify', 'remove', 'expiry'];
    Object.freeze(events);

    function future(ctx, op, body, decoder, opts) {
      f.actions(p.stepsHeaderBody(ctx, op, body, opts), codec.bytesEncoded)(ctx);
      return transport.writeCommand(ctx, decoder);
    }

    function futureDecodeOnly(ctx, op, decoder, opts) {
      f.actions(p.stepsHeader(ctx, op, opts), codec.bytesEncoded)(ctx);
      return transport.writeCommand(ctx, decoder);
    }

    function futureEmpty(ctx, op) {
      f.actions(p.stepsHeader(ctx, op), codec.bytesEncoded)(ctx);
      return transport.writeCommand(ctx);
    }

    function futureKey(ctx, op, key, body, decoder, opts) {
      f.actions(p.stepsHeaderBody(ctx, op, body, opts), codec.bytesEncoded)(ctx);
      return transport.writeKeyCommand(ctx, key, decoder);
    }

    function futurePinned(ctx, op, body, decoder, conn) {
      f.actions(p.stepsHeaderBody(ctx, op, body), codec.bytesEncoded)(ctx);
      return transport.writeCommandPinned(ctx, decoder, conn);
    }

    function futureExec(ctx, op, body, decoder, opts) {
      f.actions(p.stepsHeaderBody(ctx, op, body, opts), codec.bytesEncoded)(ctx);
      var resultPromise = transport.writeCommand(ctx, decoder);
      return resultPromise.then(function(result) {
        var skipNull = result.replace(/null/g, '\"\"');
        logger.debugf(
          'Replace, if needed, null values for empty strings: original=%s, replaced=%s'
          , result, skipNull
        );
        return skipNull;
      });
    }

    function isEventDefined(event) {
      var exists = false;
      var eventLowerCase = event.toLowerCase();

      for (var i = 0; i < events.length; i++) {
        if (events[i] === eventLowerCase) {
          exists = true;
          break;
        }
      }

      return exists;
    }

    /**
     * Iterator instance returned by completed promise from Client.iterator() calls.
     *
     * @constructs Iterator
     * @since 0.3
     */
    function iterator(iterId, conn) {
      var nextElems = [];
      var done = false;

      function nextPromise() {
        var kv = nextElems.pop();
        return new Promise(function (fulfill, reject) {
          fulfill(f.merge({done: done}, kv));
        });
      }

      function donePromise() {
        return new Promise(function (fulfill, reject) {
          fulfill({done: done});
        });
      }

      return {
        /**
         * Iterator next object returned from completed Iterator.next() calls.
         *
         * @typedef {Object} IteratorNext
         * @property {?(String|Object)} key -
         * If iteration not done, entry's key, otherwise undefined.
         * @property {?(String|Object)} value -
         * If iteration not done, entry's value, otherwise undefined.
         * @property {Boolean} done -
         * Indicates whether iteration has been completed.
         * When true, key and value will be undefined.
         * When false, key and value will be non-null.
         * @since 0.3
         */
        /**
         * Returns the next entry being iterated over.
         *
         * @returns {Promise.<IteratorNext>}
         * It returns a Promise which will be completed with an instance that
         * provides the next element.
         * @memberof Iterator#
         * @since 0.3
         */
        next: function() {
          if (done) {
            logger.tracef('Iterator(iteratorId=%s) already exhausted', iterId);
            return donePromise();
          } else if (_.isEmpty(nextElems)) {
            var ctx = transport.context(SMALL);
            logger.tracef(
                'Invoke iterator.next(msgId=%d,iteratorId=%s) on %s'
                , ctx.id, iterId, conn.toString()
            );
            var remote = futurePinned(ctx, 0x33, p.encodeIterId(iterId), p.decodeNextEntries(), conn);
            return remote.then(function(entries) {
              if (_.isEmpty(entries)) {
                done = true;
                return donePromise();
              } else {
                _.each(entries, function(entry) {
                  nextElems.push(entry);
                });
                return nextPromise();
              }
            });
          }
          logger.tracef('Return next from locally cached entries for iterator(iteratorId=%s)', iterId);
          return nextPromise();
        },
        /**
         * Close the iteration.
         *
         * @returns {Promise}
         * A Promise which will be completed once the iteration has been closed.
         * @memberof Iterator#
         * @since 0.3
         */
        close: function() {
          var ctx = transport.context(SMALL);
          logger.debugf('Invoke iterator.close(msgId=%d,iteratorId=%s) on %s', ctx.id, iterId, conn.toString());
          return futurePinned(
              ctx, 0x35, p.encodeIterId(iterId), p.complete(p.hasSuccess), conn);
        }
      }
    }

    return {
      connect: function() {
        // TODO: Avoid user calling connect by checking if connected
        var client = this;
        return transport.connect()
            .then(function() {
              logger.debugf('Started Infinispan %s', client);
              return client; // return client
            }).catch(function(error){
              logger.error(error);
              transport.disconnect();
              throw error;
            });
      },

      /**
       * Disconnect client from backend server(s).
       *
       * @returns {Promise<void>}
       * A promise that will be completed once client has
       * completed disconnection from server(s).
       * @memberof Client#
       * @since 0.3
       */
      disconnect: function() {
        return transport.disconnect();
      },
      /**
       * Get the value associated with the given key parameter.
       *
       * @param k {(String|Object)} Key to retrieve.
       * @returns {Promise.<?String>}
       * A promise that will be completed with the value associated with
       * the key, or undefined if the value is not present.
       * @memberof Client#
       * @since 0.3
       */
      get: function(k) {
        var ctx = transport.context(SMALL);
        logger.debugf('Invoke get(msgId=%d,key=%s)', ctx.id, u.str(k));
        var decoder = p.decodeValue();
        return futureKey(ctx, 0x03, k, p.encodeKey(k), decoder);
      },
      /**
       * Query the server with the given queryString.
       *
       * @param q {(Object)} query to retrieve.
       * @returns {Promise.<?Object[]>}
       * A promise that will be completed with the array of values associated with
       * the query, or empty array if the no values matches the query.
       * @memberof Client#
       * @since 1.3
       */
      query: function(q) {
        //TODO : extend the support of query with application/json datatypes
        var ctx = transport.context(SMALL);
        logger.debugf('Invoke query(msgId=%d,key=%s)', ctx.id, u.str(q));
        var decoder = p.decodeQuery();
        return futureKey(ctx, 0x1F, q, p.encodeQuery(q), decoder);
      },
      /**
       * Check whether the given key is present.
       *
       * @param k {(String|Object)} Key to check for presence.
       * @returns {Promise.<boolean>}
       * A promise that will be completed with true if there is a value
       * associated with the key, or false otherwise.
       * @memberof Client#
       * @since 0.3
       */
      containsKey: function(k) {
        var ctx = transport.context(SMALL);
        logger.debugf('Invoke containsKey(msgId=%d,key=%s)', ctx.id, u.str(k));
        return futureKey(ctx, 0x0F, k, p.encodeKey(k), p.complete(p.hasSuccess));
      },
      /**
       * Metadata value.
       *
       * @typedef {Object} MetadataValue
       * @property {(String|Object)} value - Value associated with the key
       * @property {Buffer} version - Version of the value as a byte buffer.
       * @property {Number} lifespan - Lifespan of entry, defined in seconds.
       * If the entry is immortal, it would be -1.
       * @property {Number} maxIdle - Max idle time of entry, defined in seconds.
       * If the entry is no transient, it would be -1.
       * @since 0.3
       */
      /**
       * Get the value and metadata associated with the given key parameter.
       *
       * @param k {(String|Object)} Key to retrieve.
       * @returns {Promise.<?MetadataValue>}
       * A promise that will be completed with the value and metadata
       * associated with the key, or undefined if the value is not present.
       * @memberof Client#
       * @since 0.3
       */
      getWithMetadata: function(k) {
        var ctx = transport.context(SMALL);
        logger.debugf('Invoke getWithMetadata(msgId=%d,key=%s)', ctx.id, u.str(k));
        var decoder = p.decodeWithMeta();
        return futureKey(ctx, 0x1B, k, p.encodeKey(k), decoder);
      },
      /**
       * A String formatted to specify duration unit information.
       * Duration unit is formed of two elements, the first is the number of
       * units, and the second is the unit itself: 's' for seconds, 'ms' for
       * milliseconds, 'ns' for nanoseconds, 'μs' for microseconds, 'm' for
       * minutes, 'h' for hours and 'd' for days.
       * So, for example: '1s' would be one second, '5h' five hours...etc.
       *
       * @typedef {String} DurationUnit
       * @since 0.3
       */
      /**
       * Store options defines a set of optional parameters that can be
       * passed when storing data.
       *
       * @typedef {Object} StoreOptions
       * @property {Boolean} previous - Indicates whether previous value
       * should be returned. If no previous value exists, it would return
       * undefined.
       * @property {DurationUnit} lifespan -
       * Lifespan for the stored entry.
       * @property {DurationUnit} maxIdle -
       * Max idle time for the stored entry.
       * @since 0.3
       */
      /**
       * Associates the specified value with the given key.
       *
       * @param k {(String|Object)} Key with which the specified value is to be associated.
       * @param v {(String|Object)} Value to be associated with the specified key.
       * @param opts {StoreOptions=} Optional store options.
       * @returns {Promise.<?(String|Object)>}
       * A promise that will be completed with undefined unless 'previous'
       * option has been enabled and a previous value exists, in which case it
       * would return the previous value.
       * @memberof Client#
       * @since 0.3
       */
      put: function(k, v, opts) {
        var ctx = transport.context(MEDIUM);
        logger.debugl(function() { return ['Invoke put(msgId=%d,key=%s,value=%s,opts=%s)',
                                           ctx.id, u.str(k), u.str(v), u.str(opts)]; });
        var decoder = p.decodePrevOrElse(opts, p.hasSuccess, p.complete(_.constant(undefined)));
        return futureKey(ctx, 0x01, k, p.encodeKeyValue(k, v), decoder, opts);
      },
      /**
       * Remove options defines a set of optional parameters that can be
       * passed when removing data.
       *
       * @typedef {Object} RemoveOptions
       * @property {Boolean} previous - Indicates whether previous value
       * should be returned. If no previous value exists, it would return
       * undefined.
       * @since 0.3
       */
      /**
       * Removes the mapping for a key if it is present.
       *
       * @param k {(String|Object)} Key whose mapping is to be removed.
       * @param opts {RemoveOptions=} Optional remove options.
       * @returns {Promise.<(Boolean|String|Object)>}
       * A promise that will be completed with true if the mapping was removed,
       * or false if the key did not exist.
       * If the 'previous' option is enabled, it returns the value
       * before removal or undefined if the key did not exist.
       * @memberof Client#
       * @since 0.3
       */
      remove: function(k, opts) {
        var ctx = transport.context(SMALL);
        logger.debugl(function() {return ['Invoke remove(msgId=%d,key=%s,opts=%s)',
                                          ctx.id, u.str(k), JSON.stringify(opts)]; });
        var decoder = p.decodePrevOrElse(opts, p.hasSuccess, p.complete(p.hasSuccess));
        return futureKey(ctx, 0x0B, k, p.encodeKey(k), decoder, opts);
      },
      /**
       * Conditional store operation that associates the key with the given
       * value if the specified key is not already associated with a value.
       *
       * @param k {(String|Object)} Key with which the specified value is to be associated.
       * @param v {(String|Object)} Value to be associated with the specified key.
       * @param opts {StoreOptions=} Optional store options.
       * @returns {Promise.<(Boolean|String|Object)>}
       * A promise that will be completed with true if the mapping was stored,
       * or false if the key is already present.
       * If the 'previous' option is enabled, it returns the existing value
       * or undefined if the key does not exist.
       * @memberof Client#
       * @since 0.3
       */
      putIfAbsent: function(k, v, opts) {
        var ctx = transport.context(MEDIUM);
        logger.debugl(function() {return ['Invoke putIfAbsent(msgId=%d,key=%s,value=%s,opts=%s)',
                                          ctx.id, u.str(k), u.str(v), JSON.stringify(opts)]; });
        var decoder = p.decodePrevOrElse(opts, p.hasNotExecuted, p.complete(p.hasSuccess));
        return futureKey(ctx, 0x05, k, p.encodeKeyValue(k, v), decoder, opts);
      },
      /**
       * Conditional store operation that replaces the entry for a key only
       * if currently mapped to a given value.
       *
       * @param k {(String|Object)} Key with which the specified value is associated.
       * @param v {(String|Object)} Value expected to be associated with the specified key.
       * @param opts {StoreOptions=} Optional store options.
       * @returns {Promise.<(Boolean|String|Object)>}
       * A promise that will be completed with true if the mapping was replaced,
       * or false if the key does not exist.
       * If the 'previous' option is enabled, it returns the value that was
       * replaced or undefined if the key did not exist.
       * @memberof Client#
       * @since 0.3
       */
      replace: function(k, v, opts) {
        var ctx = transport.context(MEDIUM);
        logger.debugl(function() { return ['Invoke replace(msgId=%d,key=%s,value=%s,opts=%s)',
                                           ctx.id, u.str(k), u.str(v), JSON.stringify(opts)]; });
        var decoder = p.decodePrevOrElse(opts, p.hasPrevious, p.complete(p.hasSuccess));
        return futureKey(ctx, 0x07, k, p.encodeKeyValue(k, v), decoder, opts);
      },
      /**
       * Replaces the given value only if its version matches the supplied
       * version.
       *
       * @param k {(String|Object)} Key with which the specified value is associated.
       * @param v {(String|Object)} Value expected to be associated with the specified key.
       * @param version {Buffer} binary buffer version that should match the
       * one in the server for the operation to succeed. Version information
       * can be retrieved with getWithMetadata method.
       * @param opts {StoreOptions=} Optional store options.
       * @returns {Promise.<(Boolean|String|Object)>}
       * A promise that will be completed with true if the version matches
       * and the mapping was replaced, otherwise it returns false if not
       * replaced because key does not exist or version sent does not match
       * server-side version.
       * If the 'previous' option is enabled, it returns the value that was
       * replaced if the version matches. If the version does not match, the
       * current value is returned. Fianlly if the key did not exist it
       * returns undefined.
       * @memberof Client#
       * @since 0.3
       */
      replaceWithVersion: function(k, v, version, opts) {
        var ctx = transport.context(MEDIUM);
        logger.debugl(function() { return ['Invoke replaceWithVersion(msgId=%d,key=%s,value=%s,version=0x%s,opts=%s)',
                                           ctx.id, u.str(k), u.str(v), version.toString('hex'), JSON.stringify(opts)]; });
        var decoder = p.decodePrevOrElse(opts, p.hasPrevious, p.complete(p.hasSuccess));
        return futureKey(ctx, 0x09, k, p.encodeKeyValueVersion(k, v, version), decoder, opts);
      },
      /**
       * Removes the given entry only if its version matches the
       * supplied version.
       *
       * @param k {(String|Object)} Key whose mapping is to be removed.
       * @param version {Buffer} binary buffer version that should match the
       * one in the server for the operation to succeed. Version information
       * can be retrieved with getWithMetadata method.
       * @param opts {RemoveOptions=} Optional remove options.
       * @returns {Promise.<(Boolean|String|Object)>}
       * A promise that will be completed with true if the version matches
       * and the mapping was removed, otherwise it returns false if not
       * removed because key does not exist or version sent does not match
       * server-side version.
       * If the 'previous' option is enabled, it returns the value that was
       * removed if the version matches. If the version does not match, the
       * current value is returned. Fianlly if the key did not exist it
       * returns undefined.
       * @memberof Client#
       * @since 0.3
       */
      removeWithVersion: function(k, version, opts) {
        var ctx = transport.context(SMALL);
        logger.debugl(function() { return ['Invoke removeWithVersion(msgId=%d,key=%s,version=0x%s,opts=%s)',
                                           ctx.id, u.str(k), version.toString('hex'), JSON.stringify(opts)]; });
        var decoder = p.decodePrevOrElse(opts, p.hasPrevious, p.complete(p.hasSuccess));
        return futureKey(ctx, 0x0D, k, p.encodeKeyVersion(k, version), decoder, opts);
      },
      /**
       * Key/value entry.
       *
       * @typedef {Object} Entry
       * @property {(String|Object)} key - Entry's key.
       * @property {(String|Object)} value - Entry's value.
       * @since 0.3
       */
      /**
       * Retrieves all of the entries for the provided keys.
       *
       * @param keys {(String[]|Object[])} Keys to find values for.
       * @returns {Promise.<Entry[]>}
       * A promise that will be completed with an array of entries for all
       * keys found. If a key does not exist, there won't be an entry for that
       * key in the returned array.
       * @memberof Client#
       * @since 0.3
       */
      getAll: function(keys) {
        var ctx = transport.context(MEDIUM);
        logger.debugf('Invoke getAll(msgId=%d,keys=%s)', ctx.id, u.str(keys));
        // TODO: Validate empty keys
        return future(ctx, 0x2F, p.encodeMultiKey(keys), p.decodeCountValues());
      },
      /**
       * Multi store options defines a set of optional parameters that can be
       * passed when storing multiple entries.
       *
       * @typedef {Object} MultiStoreOptions
       * @property {DurationUnit} lifespan -
       * Lifespan for the stored entry.
       * @property {DurationUnit} maxIdle -
       * Max idle time for the stored entry.
       * @since 0.3
       */
      /**
       * Stores all of the mappings from the specified entry array.
       *
       * @param pairs {Entry[]} key/value pair mappings to be stored
       * @param opts {MultiStoreOptions=}
       * Optional storage options to apply to all entries.
       * @returns {Promise}
       * A promise that will be completed when all entries have been stored.
       * @memberof Client#
       * @since 0.3
       */
      putAll: function(pairs, opts) {
        var ctx = transport.context(BIG);
        logger.debugl(function() { return ['Invoke putAll(msgId=%d,pairs=%s,opts=%s)',
                                           ctx.id, JSON.stringify(pairs), JSON.stringify(opts)]; });
        return future(ctx, 0x2D, p.encodeMultiKeyValue(pairs), p.complete(_.constant(undefined)), opts);
      },
      /**
       * Iterator options defines a set of optional parameters that
       * control how iteration occurs and the data that's iterated over.
       *
       * @typedef {Object} IteratorOptions
       * @property {Boolean} metadata - Indicates whether entries iterated
       * over also expose metadata information. This option is false by
       * default which means no metadata information is exposed on iteration.
       * @since 0.3
       */
      /**
       * Iterate over the entries stored in server(s).
       *
       * @param batchSize {Number}
       * The number of entries transferred from the server at a time.
       * @param opts {IteratorOptions=} Optional iteration settings.
       * @return {Promise.<Iterator>}
       * A promise that will be completed with an iterator that can be used
       * to retrieve stored elements.
       * @memberof Client#
       * @since 0.3
       */
      iterator: function(batchSize, opts) {
        var ctx = transport.context(SMALL);
        logger.debugf('Invoke iterator(msgId=%d,batchSize=%d,opts=%s)', ctx.id, batchSize, u.str(opts));
        var remote = future(ctx, 0x31, p.encodeIterStart(batchSize, opts), p.decodeIterId);
        return remote.then(function(result) {
          return iterator(result.iterId, result.conn);
        });
      },
      /**
       * Count of entries in the server(s).
       *
       * @returns {Promise.<Number>}
       * A promise that will be completed with the number of entries stored.
       * @memberof Client#
       * @since 0.3
       */
      size: function() {
        var ctx = transport.context(TINY);
        logger.debugf('Invoke size(msgId=%d)', ctx.id);
        return futureDecodeOnly(ctx, 0x29, p.decodeVInt);
      },
      /**
       * Clear all entries stored in server(s).
       *
       * @returns {Promise}
       * A promise that will be completed when the clear has been completed.
       * @memberof Client#
       * @since 0.3
       */
      clear: function() {
        var ctx = transport.context(TINY);
        logger.debugf('Invoke clear(msgId=%d)', ctx.id);
        return futureEmpty(ctx, 0x13);
      },
      /**
       * Pings the server(s).
       *
       * @returns {Promise}
       * A promise that will be completed when ping response was received.
       * @memberof Client#
       * @since 0.3
       */
      ping: function() {
        var ctx = transport.context(TINY);
        logger.debugf('Invoke ping(msgId=%d)', ctx.id);
        return futureDecodeOnly(ctx, 0x17, p.decodePingResponse);
      },

      /**
       * Statistic item.
       *
       * @typedef {Object} StatsItem
       * @property {String} STAT_NAME -
       * Name of the statistic.
       * @property {String} STAT_VALUE -
       * Value of the statistic.
       * @since 0.3
       */
      /**
       * Retrieve various statistics from server(s).
       *
       * @returns {Promise<StatsItem[]>}
       * A promise that will be completed with an array of statistics, where
       * each element will have a single property. This single property will
       * have the statistic name as property name and statistic value as
       * property value.
       * @memberof Client#
       * @since 0.3
       */
      stats: function() {
        var ctx = transport.context(TINY);
        logger.debugf('Invoke stats(msgId=%d)', ctx.id);
        return futureDecodeOnly(ctx, 0x15, p.decodeStringPairs);
      },
      /**
       * Listener options.
       *
       * @typedef {Object} ListenOptions
       * @property {String} listenerId - Listener identifier can be passed
       * in as parameter to register multiple event callback functions for
       * the same listener.
       * @since 0.3
       */
      /**
       * Add an event listener.
       *
       * @param {String} event
       * Event to add listener to. Possible values are:
       * 'create', 'modify', 'remove' and 'expiry'.
       * @param {Function} listener
       * Function to invoke when the listener event is received.
       * 'create' and 'modify' events callback the function with key,
       * entry version and listener id.
       * 'remove' and 'expiry' events callback the function with key
       * and listener id.
       * @param opts {ListenOptions=} Options for adding listener.
       * @returns {Promise<String>}
       * A promise that will be completed with the identifier of the listener.
       * This identifier can be used to register multiple callbacks with the
       * same listener, or to remove the listener.
       * @memberof Client#
       * @since 0.3
       */
      addListener: function(event, listener, opts) {
        if (isEventDefined(event)) {
            var ctx = transport.context(SMALL);
            if (_.has(opts, 'listenerId')) {
                var conn = listen.findConnectionListener(opts.listenerId);
                if (!f.existy(conn))
                    return Promise.reject(
                        new Error('No server connection for listener (listenerId=' + opts.listenerId + ')'));

                return listen.addLocalListener(ctx, event, listener, opts);
            } else {
                return listen.addRemoteListener(transport, ctx, event, listener, opts);
            }
        } else {
            return Promise.reject(
                new Error('The event \'' + event + '\' is not supported'));
        }
      },
      /**
       * Remove an event listener.
       *
       * @param {String} listenerId
       * Listener identifier to identify listener to remove.
       * @return {Promise}
       * A promise that will be completed when the listener has been removed.
       * @memberof Client#
       * @since 0.3
       */
      removeListener: function(listenerId) {
        var ctx = transport.context(SMALL);
        logger.debugf('Invoke removeListener(msgId=%d,listenerId=%s) remotely', ctx.id, listenerId);
        var conn = listen.findConnectionListener(listenerId);
        if (!f.existy(conn))
          return Promise.reject(
            new Error('No server connection for listener (listenerId=' + listenerId + ')'));

        var remote = futurePinned(ctx, 0x27, p.encodeListenerId(listenerId), p.complete(p.hasSuccess), conn);
        return remote.then(function (success) {
          if (success) {
            listen.removeListeners(listenerId);
            return true;
          }
          return false;
        });
      },
      /**
       * Add script to server(s).
       *
       * @param {String} scriptName Name of the script to store.
       * @param {String} script Script to store in server.
       * @return {Promise}
       * A promise that will be completed when the script has been stored.
       * @memberof Client#
       * @since 0.3
       */
      addScript: function(scriptName, script) {
        var scriptClientOpts = f.merge(clientOpts, {cacheName: '___script_cache'});
        var scriptClient = new Client(addrs, scriptClientOpts);
        logger.debugf('Invoke addScript(scriptName=%s)', scriptName);
        return scriptClient.connect().then(function(c) {
          return c.put(scriptName, script)
              .finally(function() { return c.disconnect(); });
        });
      },
      /**
       * Script execution parameters.
       *
       * @typedef {Object} ExecParams
       * @property {String} PARAM_NAME -
       * Name of the parameter.
       * @property {String} PARAM_VALUE -
       * Value of the parameter.
       * @since 0.3
       */
      /**
       * Execute the named script passing in optional parameters.
       *
       * @param {String} scriptName Name of the script to execute.
       * @param {ExecParams[]} [params]
       * Optional array of named parameters to pass to script in server.
       * @returns {Promise<String|String[]>}
       * A promise that will be completed with either the value returned by the
       * script after execution for local scripts, or an array of values
       * returned by the script when executed in multiple servers for
       * distributed scripts.
       * @memberof Client#
       * @since 0.3
       */
      execute: function(scriptName, params) {
        var ctx = transport.context(SMALL);
        logger.debugf('Invoke execute(msgId=%d,scriptName=%s,params=%s)', ctx.id, scriptName, u.str(params));
        // TODO update jsdoc, value does not need to be String, can be JSON too
        return futureExec(ctx, 0x2B, p.encodeNameParams(scriptName, params), p.decodeValue());
      },
      /**
       * Get server topology related information.
       *
       * @returns {TopologyInfo}
       * An object instance that can be used to query diverse information
       * related to the server topology information.
       * @memberof Client#
       * @since 0.3
       */
      getTopologyInfo: function() {
        return new TopologyInfo(transport);
      },
      /**
       * Get client information represented as a string.
       * @memberof Client#
       * @since 0.4
       */
      toString: function() {
        return util.format('Client(%s)', transport);
      },

      registerProtostreamType: function(typeName,descriptorId){
        return p.registerProtostreamType(typeName,descriptorId);
      },

      registerProtostreamRoot: function(root){
        return p.registerProtostreamRoot(root);
      }
    }
  };

  /**
   * Server topology information.
   *
   * @constructs Topology
   * @since 0.3
   */
  var TopologyInfo = function(transport) {
    return {
      /**
       * Get the server topology identifier.
       *
       * @returns {Number} Topology identifier.
       * @memberof Topology#
       * @since 0.3
       */
      getTopologyId: function() {
        return transport.getTopologyId();
      },
      /**
       * Get the list of servers that the client is currently connected to.
       *
       * @return {ServerAddress[]} An array of server addresses.
       * @memberof Topology#
       * @since 0.3
       */
      getMembers: function() {
        return transport.getMembers();
      },
      /**
       * Find the list of server addresses that are owners for a given key.
       *
       * @param {(String|Object)} k Key to find owners for.
       * @return {ServerAddress[]}
       * An array of server addresses that are owners for the given key.
       * @memberof Topology#
       * @since 0.3
       */
      findOwners: function(k) {
        return transport.findOwners(k);
      },
      /**
       * Switch remote cache manager to a different cluster,
       * previously declared via configuration.
       *
       * @param clusterName name of the cluster to which to switch to
       * @return {Promise<Boolean>}
       * A promise encapsulating a Boolean that indicates {@code true} if the
       * switch happened, or {@code false} otherwise.
       * @memberof Topology#
       * @since 0.4
       */
      switchToCluster: function(clusterName) {
        return transport.switchToCluster(clusterName);
      },
      /**
       * Switch remote cache manager to the default cluster,
       * previously declared via configuration.
       *
       * @return {Promise<Boolean>}
       * A promise encapsulating a Boolean that indicates {@code true} if the
       * switch happened, or {@code false} otherwise.
       * @memberof Topology#
       * @since 0.4
       */
      switchToDefaultCluster: function() {
        return transport.switchToDefaultCluster();
      }
    }
  };

  /**
   * Server address.
   *
   * @typedef {Object} ServerAddress
   * @property {String} host - Server host name.
   * @property {Number} port - Server port.
   * @since 0.3
   */
  /**
   * Infinispan client constructor taking an optional initial address,
   * or multiple addresses, to which the client will try to connect to,
   * as well as optional configuration settings.
   *
   * @example
   * client({port: 11222, host: 'localhost'})
   *
   * @example
   * client([{port: 11322, host: 'node1'}, {port: 11422, host: 'node2'}])
   *
   * @example
   * client({port: 11522, host: 'myhost'}, {version: '2.2'})
   *
   * @example
   * client([{port: 11522, host: 'myhost'}, {port: 11622, host: 'myhost'}],
   *        {version: '2.2', cacheName: 'myCache'})
   *
   * @param args {(ServerAddress|ServerAddress[])}
   * Optional single or multiple addresses to which to connect. If none
   * provided, the client will connect to localhost:11222 address by default.
   * @param [options] {ClientOptions}
   * Optional configuration settings.
   * @constructs Client
   * @returns {Promise<ReturnType<Client>>}
   * @since 0.3
   */
  exports.client = function client(args, options) {
    var merged = f.merge(Client.config, options);
    var c = new Client(u.normalizeAddresses(args), merged);

    return c.connect();
  };
  /**
   * Cluster information.
   *
   * @typedef {Object} Cluster
   * @property {String} name - Cluster name.
   * @property {ServerAddress[]} servers - Cluster servers details.
   * @since 0.3
   */
  /**
   * Client configuration settings. Object instances that override
   * these configuration options can be used on client construction to tweak
   * its behaviour.
   *
   * @static
   * @typedef {Object} ClientOptions
   * @property {?(2.9|2.5|2.2)} [version=2.9] - Version of client/server protocol.
   * @property {?String} [cacheName] - Optional cache name.
   * @property {?Number} [maxRetries=3] - Optional number of retries for operation.
   * @property {?Object} [ssl] - TLS/SSL properties.
   * @property {?boolean} [ssl.enabled=false] - Optional flag to enable SSL support.
   * @property {?String} [ssl.secureProtocol=TLSv1_2_method] - Optional field with secure protocol in use.
   * @property {?String[]} [ssl.trustCerts] - Optional paths of trusted SSL certificates.
   * @property {?String} [ssl.clientAuth.key] - Optional path to client authentication key.
   * @property {?String} [ssl.clientAuth.passphrase] - Optional password for client key.
   * @property {?String} [ssl.clientAuth.cert] - Optional client certificate.
   * @property {?String} [ssl.sniHostName] - Optional SNI host name.
   * @property {?String} [ssl.cryptoStore.path] - Optional crypto store path.
   * @property {?String} [ssl.cryptoStore.passphrase] - Optional password for crypto store.
   * @property {?Object} [authentication]- Authentication properties.
   * @property {?boolean} [authentication.enabled]- Enable authentication.
   * @property {?String} [authentication.saslMechanism] - Select the SASL mechanism to use. Can be one of PLAIN, DIGEST-MD5, SCRAM-SHA-1, SCRAM-SHA-256, SCRAM-SHA-384, SCRAM-SHA-512, EXTERNAL, OAUTHBEARER
   * @property {?String} [authentication.userName] - The authentication username. Required by the PLAIN, DIGEST and SCRAM mechanisms.
   * @property {?String} [authentication.password] - The authentication password. Required by the PLAIN, DIGEST and SCRAM mechanisms.
   * @property {?String} [authentication.token] - The OAuth token. Required by the OAUTHBEARER mechanism.
   * @property {?String} [authentication.authzid] - The SASL authorization ID.
   * @property {?String} [authentication.authzid] - The SASL authorization ID.
   * @property {?Object} [dataFormat] - Content-type for entry
   * @property {?String} [dataFormat.keyType] - Content-type for key
   * @property {?String} [dataFormat.valueType] - Content-type for value
   * @property {?boolean} [topologyUpdates=true] - Optional flag to controls whether the client deals with topology updates or not.
   * @property {?("text/plain"|"application/json")} [mediaType="text/plain"] - Media type of the cache contents.
   * @property {?Cluster[]} [clusters] - Optional additional clusters for cross-site failovers.
   * @since 0.3
   */
  Client.config = {
    version: '2.9',         // Hot Rod protocol version
    cacheName: undefined,   // Cache name
    maxRetries: 3,           // Maximum number of retries
    authentication: {
      enabled: false,
      serverName: 'infinispan',
      saslProperties: {},
      saslMechanism: '',
      userName: '',
      password: [],
      realm: 'default',
      token: ''
    },
    ssl: {
      enabled: false,
      secureProtocol: 'TLS_client_method',
      trustCerts: [],
      clientAuth: {
        key: undefined,
        passphrase: undefined,
        cert: undefined
      },
      sniHostName: undefined,
      cryptoStore: {
        path: undefined,
        passphrase: undefined
      }
    },
    dataFormat : {
      keyType: 'text/plain',
      valueType: 'text/plain'
    },
    topologyUpdates: true,
    clusters: []
  };

}.call(this));
