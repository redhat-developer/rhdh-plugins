'use strict';

(function() {

  var _ = require('underscore');
  
  var f = require('./functional');
  var u = require('./utils');
  var codec = require('./codec');

  var logger = u.logger('protocols');
  var Factory = require('./sasl/factory');
  var factory = new Factory();
  factory.use(require('./sasl/plain'));
  factory.use(require('./sasl/external'));
  factory.use('DIGEST-MD5', require('./sasl/digest'));
  factory.use('SCRAM-SHA-1', require('./sasl/scram'));
  factory.use('SCRAM-SHA-256', require('./sasl/scram'));
  factory.use('SCRAM-SHA-384', require('./sasl/scram'));
  factory.use('SCRAM-SHA-512', require('./sasl/scram'));
  factory.use('OAUTHBEARER', require('./sasl/oauthbearer'));

  var INFINITE_LIFESPAN = 0x01, INFINITE_MAXIDLE = 0x02; // Duration flag masks
  var MAGIC = 0xA0;

  function decodePairActions(decoderKey, decoderValue) {
    return f.actions(
        [
          decoderKey.fun(decoderKey.obj)
          , decoderValue.fun(decoderValue.obj)
        ]
        , function(values) {
            if (values.length < 2) {
              logger.tracef("Not enough to read (not array): %s", values);
              return undefined;
            }

            return {key: values[0], value: values[1]};
        });
  }

  var DECODE_STRING_PAIR = f.actions(
      [codec.decodeString(), codec.decodeString()],
      function(values) {
        if (values.length < 2) {
          logger.tracef("Not enough to read (not array): %s", values);
          return undefined;
        }

        var pair = {};
        pair[values[0]] = parseInt(values[1]);
        return pair;
      });
  var DECODE_STRING = f.actions([codec.decodeString()], codec.lastDecoded);
  var DECODE_TIMESTAMP = f.actions([codec.decodeLong(), codec.decodeVInt()], codec.allDecoded(2));
  var DECODE_UBYTE = f.actions([codec.decodeUByte()], codec.lastDecoded);
  var DECODE_VINT = f.actions([codec.decodeVInt()], codec.lastDecoded);
  var DECODE_SHORT = f.actions([codec.decodeShort()], codec.lastDecoded);

  function hasOpt(opts, name) { return _.has(opts, name) && f.truthy(opts[name]); }
  function hasOptPrev(opts) { return hasOpt(opts, 'previous'); }

  function decodeTimestamp(flags, mask, headers, bytebuf) {
    var timestamp;
    if (((flags & mask) != mask)) {
      var decoded = DECODE_TIMESTAMP(bytebuf);
      if (decoded.length < 2)
        return undefined;

      timestamp = decoded;
    } else {
      timestamp = [-1, -1];
    }

    return _.object(headers, timestamp);
  }

  function decodeSingle(decoder) {
    return f.actions([decoder.fun(decoder.obj)], codec.lastDecoded);
  }

  function decoderMedia(obj) {
    return {
      obj: obj
      , fun: f.invoker('decodeMedia', obj.decodeMedia)
    };
  }

  var EncodeMixin = (function() {
    var logger = u.logger('encoder');

    return {
      buildFlags: function (opts) { // TODO: Move out to a Mixin (similar to expiry)
        return hasOptPrev(opts) ? 0x01 : 0;
      },
      encodeHeader: function (op, topologyId, opts) {
        logger.tracef('Encode operation with topology id %d', topologyId);
        var protocolVersion = this.version;
        var cacheName = this.clientOpts['cacheName'];
        var flags = this.buildFlags(opts);
        var clientIntelligence = this.clientOpts['topologyUpdates'] ? 3 : 1;
        return function(id) {
          return [
            codec.encodeUByte(MAGIC),                       // magic
            codec.encodeVLong(id),                          // msg id
            codec.encodeUByte(protocolVersion),             // version
            codec.encodeUByte(op),                          // op code
            codec.encodeString(cacheName),                  // cache name
            codec.encodeVInt(f.existy(flags) ? flags : 0),  // flags
            codec.encodeUByte(clientIntelligence),          // basic client intelligence
            codec.encodeVInt(topologyId)                    // client topology id
          ];
        }
      },
      encodeKey: function (k) {
        var outer = this;
        return function() {
          return [outer.encodeMediaKey(k)]; // key
        }
      },
      encodeQuery: function (q) {
        return function() {
          return [codec.encodeQuery(q)]; // query
        }
      },
      encodeKeyVersion: function (k, version) {
        var outer = this;
        return function() {
          return [outer.encodeMediaKey(k), codec.encodeBytes(version)]; // key + version
        }
      },
      encodeKeyValue: function (k, v) {
        var outer = this;
        return function(opts) {
          return f.cat(
              [outer.encodeMediaKey(k)],        // key
              outer.encodeExpiry(opts),     // lifespan & max idle
              [outer.encodeMediaValue(v)]       // value
          );
        }
      },
      encodeKeyValueVersion: function (k, v, version) {
        var outer = this;
        return function(opts) {
          return f.cat(
              [outer.encodeMediaKey(k)],             // key
              outer.encodeExpiry(opts),         // lifespan & max idle
              [codec.encodeBytes(version),      // version
               outer.encodeMediaValue(v)]            // value
          );
        }
      },
      encodeMultiKey: function (keys) {
        var outer = this;
        return function() {
          var base = [
            codec.encodeVInt(_.size(keys))            // key count
          ];
          var withKeys = _.map(keys, function (key) {
            return outer.encodeMediaKey(key);           // key
          });

          return f.cat(base, withKeys);
        };
      },
      encodeMultiKeyValue: function (pairs) {
        var outer = this;
        return function(opts) {
          var withPairs = _.map(pairs, function (pair) {
            return [
              outer.encodeMediaKey(pair.key),    // key
              outer.encodeMediaValue(pair.value)   // value
            ]
          });

          return f.cat(
              outer.encodeExpiry(opts),           // lifespan & max idle
              [codec.encodeVInt(_.size(pairs))],  // entry count
              _.flatten(withPairs));              // key + value pairs
        };
      },
      encodeNameParams: function(name, params) {
        var outer = this;
        return function() {
          var steps = [codec.encodeString(name), codec.encodeVInt(_.keys(params).length)];
          _.mapObject(params, function(val, key) {
            steps.push(codec.encodeString(key));
            steps.push(outer.encodeMediaValue(val));
          });
          return steps;
        };
      },
      stepsHeader: function(ctx, op, opts) {
        var header = this.encodeHeader(op, ctx.topologyId, opts)(ctx.id);
        var mediaType = this.encodeMediaTypes();
        return f.cat(header, mediaType);
      },
      stepsHeaderBody: function(ctx, op, body, opts) {
        var header = this.stepsHeader(ctx, op, opts, ctx.topologyId);
        return f.cat(header, body(opts));
      }
  };
  }());

  var ExpiryEncodeMixin = (function() {
    function parseDuration(d) {
      if (!f.existy(d)) {
        return [undefined, 7];
      } else if(_.isNumber(d)) {
        // Numeric durations only allowed to describe infinite (negative) or default durations (0)
        if (d < 0) return [undefined, 8];
        else if (d == 0) return [undefined, 7];
        else throw new Error('Positive duration provided without time unit: ' + d);
      } else {
        var splitter = /(\d+)[\s,]*([a-zμ]+)/g;
        var matches = splitter.exec(d);
        if (f.existy(matches))
          return [parseInt(matches[1]), timeUnitToByte(matches[2])];
        else
          throw new Error('Unknown duration format for ' + d);
      }
    }

    function timeUnitToByte(unit) {
      switch (unit) {
        case 's': return 0;
        case 'ms': return 1;
        case 'ns': return 2;
        case 'μs': return 3;
        case 'm': return 4;
        case 'h': return 5;
        case 'd': return 6;
        default: // TODO: Could it be caught in regular expression?
          throw new Error('Unknown duration unit in ' + unit);
      }
    }

    return {
      encodeExpiry: function (opts) {
        if (f.existy(opts)) {
          var lifespan = parseDuration(opts['lifespan']);
          var maxIdle = parseDuration(opts['maxIdle']);
          // The way lifespan/maxIdle definitions are interleaved is messy :|
          var steps = [codec.encodeUByte(lifespan[1] << 4 | maxIdle[1])];
          if (f.existy(lifespan[0])) steps.push(codec.encodeVInt(lifespan[0]));
          if (f.existy(maxIdle[0])) steps.push(codec.encodeVInt(maxIdle[0]));
          return steps;
        }
        return [codec.encodeUByte(0x77)]; // default lifespan & max idle
      }
    }
  }());

  var DecodeMixin = (function() {
    var logger = u.logger('decoder');

    var DECODE_HEADER = f.actions(
        [codec.decodeUByte(),   // magic
        codec.decodeVLong(),    // msg id
        codec.decodeUByte(),    // op code
        codec.decodeUByte(),    // status
        codec.decodeUByte()     // topology change marker
        ], function(values) {
          if (values.length < 5) {
            logger.tracef("Not enough to read (not array): %s", values);
            return undefined;
          }

          return {
            msgId: values[1], opCode: values[2],
            status: values[3], hasNewTopology: values[4] == 1
          }
        });
    // var DECODE_VERSIONED = f.actions([codec.decodeFixedBytes(8), codec.decodeObject()],
    //                                  function(values) { return {version: values[0], value: values[1]}; });
    // var DECODE_VINT = f.actions([codec.decodeVInt()], codec.lastDecoded);

    var DECODE_TOPO_HEADER = f.actions(
        [codec.decodeVInt(), codec.decodeVInt()],
        function(values) {
          if (values.length < 2) {
            logger.tracef("Not enough to read (not array): %s", values);
            return undefined;
          }

          return {id: values[0], numServers: values[1]};
        });
    var DECODE_HASH_HEADER = f.actions(
        [codec.decodeUByte(), codec.decodeVInt()],
        function(values) {
          if (values.length < 2) {
            logger.tracef("Not enough to read (not array): %s", values);
            return undefined;
          }

          return {hashFunct: values[0], numSegments: values[1]};
        });
    var DECODE_HOST_PORT = f.actions([codec.decodeString(), codec.decodeShort()],
                                       function(values) { return {host: values[0], port: values[1]}; });

    var SUCCESS = 0x00, NOT_EXECUTED = 0x01, NOT_FOUND = 0x02, // Status codes
      SUCCESS_WITH_PREV = 0x03, NOT_EXECUTED_WITH_PREV = 0x04; // Status codes

    function isSuccess(status) {
      return status == SUCCESS || status == SUCCESS_WITH_PREV;
    }

    function isNotExecuted(status) {
      return status == NOT_EXECUTED || status == NOT_EXECUTED_WITH_PREV;
    }

    function hasPrevious(status) {
      return status == SUCCESS_WITH_PREV || status == NOT_EXECUTED_WITH_PREV;
    }

    function hasError(header) { return header.opCode == 0x50; }

    function decodePrev(header, bytebuf, decoder) {
      var decodeActions = decodeSingle(decoder);
      var prev = decodeActions(bytebuf);
      if (f.existy(prev))
        return {result: _.isEmpty(prev) ? undefined : prev, continue: true};
      else
        return {continue: false};
    }

    function decodeObject(header, bytebuf, action) {
      if (isSuccess(header.status)) {
        var obj = action(bytebuf);
        if (f.existy(obj)) return {result: obj, continue: true};
        else return {continue: false};
      }
      return {result: undefined, continue: true};
    }

    return {
      decodeHeader: function(bytebuf) {
        try {
          var header = DECODE_HEADER(bytebuf);
          if (f.existy(header)) {
            logger.tracef("Read header(msgId=%d): opCode=%s, status=%s, hasNewTopology=%d",
                          header.msgId, header.opCode, header.status, header.hasNewTopology);
            return {continue: true, result: header};
          }

          return {continue: false, result: undefined};
        } catch(ex) {
          logger.error('Error decoding header, message id unknown:', ex);
          throw ex;
        }
      },
      decodeError: function(header, bytebuf) {
        var msg = DECODE_STRING(bytebuf);
        logger.error('Error decoding body of request(msgId=%d): %s', header.msgId, msg);
        return {continue: true, result: msg};
      },
      decodeBody: function(decoder, header, bytebuf, conn) {
        logger.tracef('Call decode for request(msgId=%d)', header.msgId);
        return f.existy(decoder)
            ? decoder(header, bytebuf, conn)
            : {continue: true, result: undefined};
      },
      decodeValue: function() {
        var decoderValue = decoderMedia(this.valueMediaType);
        return function(header, bytebuf) {
          var decodeAction = decodeSingle(decoderValue);
          return decodeObject(header, bytebuf, decodeAction);
        }
      },
      decodeQuery: function() {
        return function(header, bytebuf) {
          var decodeAction = f.actions([f.partial2(codec.decodeQuery,ProtostreamType.lookupProtostreamTypeById,ProtobufRoot.findRootByTypeName)()],codec.lastDecoded);
          return decodeObject(header, bytebuf, decodeAction);
        }
      },
      decodeWithMeta: function() {
        var decoderValue = decoderMedia(this.valueMediaType);
        return function(header, bytebuf) {
          if (isSuccess(header.status)) {
            var flags = DECODE_UBYTE(bytebuf);
            if (!f.existy(flags))
              return {continue: false};

            logger.tracef('Decode with metadata, flags are: %d', flags);

            var lifespan = decodeTimestamp(flags, INFINITE_LIFESPAN, ['created', 'lifespan'], bytebuf);
            if (!f.existy(lifespan))
              return {continue: false};

            var idle = decodeTimestamp(flags, INFINITE_MAXIDLE, ['lastUsed', 'maxIdle'], bytebuf);
            if (!f.existy(idle))
              return {continue: false};

            var decoder = f.actions(
              [codec.decodeFixedBytes(8), decoderValue.fun(decoderValue.obj)]
              , function(values) {
                  return {version: values[0], value: values[1]};
              });
            var versioned = decoder(bytebuf);
            return f.existy(versioned)
                ? {result: f.merge(versioned, lifespan, idle), continue: true}
                : {continue: false};
          }

          return {result: undefined, continue: true};
        }
      },
      decodePrevOrElse: function(opts, cond, orElse) {
        var decoderValue = decoderMedia(this.valueMediaType);
        var shouldReturnPrev = hasOptPrev(opts);
        return function(header, bytebuf) {
          if (shouldReturnPrev)
            return cond(header)
                ? decodePrev(header, bytebuf, decoderValue)
                : {result: undefined, continue: true};

          return orElse(header);
        }
      },
      decodeCountValues: function() {
        var decoderKey = decoderMedia(this.keyMediaType);
        var decoderValue = decoderMedia(this.valueMediaType);
        return function(header, bytebuf) {
          var count = DECODE_VINT(bytebuf);
          var pairs = [], i = 0;
          while (i++ < count) {
            var pair = decodePairActions(decoderKey, decoderValue)(bytebuf);
            if (f.existy(pair)) pairs.push(pair);
            else return {continue: false};
          }

          return {result: pairs, continue: true};
        }
      },
      decodeStringPairs: function(header, bytebuf) {
        var count = DECODE_VINT(bytebuf);
        var pairs = [], i = 0;
        while (i++ < count) {
          var pair = DECODE_STRING_PAIR(bytebuf);
          if (f.existy(pair)) pairs.push(pair);
          else return {continue: false};
        }

        var obj = _.reduce(pairs, function(o, pair) {
          return f.merge(pair, o);
        }, {});

        return {result: obj, continue: true};
      },
      decodeTopology: function(bytebuf) {
        var topologyHeader = DECODE_TOPO_HEADER(bytebuf);
        if (!f.existy(topologyHeader))
          return {done: false};

        var addrs = [], i = 0;
        while (i++ < topologyHeader.numServers) {
          var addr = DECODE_HOST_PORT(bytebuf);
          if (f.existy(addr)) addrs.push(addr);
          else return {done: false};
        }

        var hashHeader = DECODE_HASH_HEADER(bytebuf);
        if (!f.existy(hashHeader))
          return {done: false};

        var segs = new Array(hashHeader.numSegments);
        for (var j = 0; j < hashHeader.numSegments; j++) {
          var numOwners = DECODE_UBYTE(bytebuf);
          if (f.existy(numOwners)) {
            segs[j] = new Array(numOwners);
            for (var k = 0; k < numOwners; k++) {
              var memberIndex = DECODE_VINT(bytebuf);
              if (f.existy(memberIndex)) segs[j][k] = addrs[memberIndex];
              else return {done: false};
            }
          } else {
            return {done: false};
          }
        }

        return {id: topologyHeader.id, servers: addrs, segments: segs, done: true};
      },
      decodeVInt: function(header, bytebuf) {
        var num = DECODE_VINT(bytebuf);
        return {result: num, continue: true};
      },
      hasSuccess: function(header) {
        return isSuccess(header.status);
      },
      hasNotExecuted: function(header) {
        return isNotExecuted(header.status);
      },
      hasPrevious: function(header) {
        return hasPrevious(header.status);
      },
      isEvent: function(header) {
        //return ((op(header) >> 4) & 0x06) == 0x06;
        return ((header.opCode >> 4) & 0x06) == 0x06;
      },
      isError: function(header) {
        return header.opCode == 0x50;
      },
      complete: function(f) {
        return function(header) {
          return {result: f(header), continue: true};
        }
      }
    }
  }());

  var ListenersMixin = (function() {
    var logger = u.logger('protocols.listeners');

    var DECODE_EVENT_COMMON = f.actions(
        [codec.decodeString(),      // listener id
        codec.decodeUByte(),        // custom event marker
        codec.decodeUByte()],       // event is retried
        function(values) {
          if (values.length < 3) {
            logger.tracef("Not enough to read (not array): %s", values);
            return undefined;
          }

          return {listenerId: values[0], isCustom: values[1] == 1, isRetried: values[2] == 1}
        });

    function emitCustomOr(isCustom, decoderBytes, alternativeEmit) {
      if (isCustom) {
        return function(event, emitter, bytebuf, listenerId) {
          var decoder = f.actions(
            [decoderBytes.fun(decoderBytes.obj)]
            , function(values) {
              return {result: values[0]};
            }
          );
          var custom = decoder(bytebuf);
          logger.tracel(function() {
            return ['Try to emit %s event %s', event, custom.result]; });

          // TODO workaround ISPN-10166: key/value/prev should be JSON
          if (_.has(custom.result, '_type')) {
            custom.result.key = JSON.parse(custom.result.key);
            custom.result.value = JSON.parse(custom.result.value);
            custom.result.prev = JSON.parse(custom.result.prev);
          }

          var success = emitter.emit(event, custom.result, listenerId);
          if (success) logger.tracef('Event emitted');
          else logger.tracef('No listener defined for %s event', event);
          return true;
        };
      }
      return alternativeEmit(decoderBytes);
    }

    function emitKeyVersion(decoderKey) {
      return function(event, emitter, bytebuf, listenerId) {
        var decoder = f.actions(
          [decoderKey.fun(decoderKey.obj), codec.decodeFixedBytes(8)]
          , function(values) {
            return {key: values[0], version: values[1]};
          }
        );
        var keyVersion = decoder(bytebuf);
        logger.tracel(function() {
          return ['Try to emit %s event for key=%s and version=%s',
                  event, keyVersion.key, keyVersion.version.toString('hex')]; });
        var success = emitter.emit(event, keyVersion.key, keyVersion.version, listenerId);
        if (success) logger.tracef('Event emitted');
        else logger.tracef('No listener defined for %s event', event);
        return true;
      };
    }

    function emitKey(decodeFn) {
      return function(event, emitter, bytebuf, listenerId) {
        var decodeActions = decodeSingle(decodeFn);
        var key = decodeActions(bytebuf);
        logger.tracef('Emit %s event for key=%s', event, key);
        emitter.emit(event, key, listenerId);
        return true;
      }
    }

    return {
      findConnectionListener: function(listenerId) {
        var l = listeners.get(listenerId);
        return f.existy(l) ? l.conn : undefined;
      },
      removeListeners: function(listenerId) {
        var l = listeners.get(listenerId);
        if (f.existy(l)) {
          l.emitter.removeAllListeners();
          listeners.remove(listenerId);
        }
      },
      encodeListenerAdd: function(listenerId, opts) {
        var includeState = hasOpt(opts, 'includeState') ? 1 : 0;

        var steps = [
          codec.encodeString(listenerId),     // listener id
          codec.encodeUByte(includeState),    // include state
          codec.encodeUByte(0)                // TODO filter factory name
        ];

        if (_.has(opts, "converterFactory") && _.has(opts.converterFactory, "name")) {
          steps.push(codec.encodeString(opts.converterFactory.name));
          steps.push(codec.encodeUByte(0));   // TODO add converter parameter support
        } else {
          steps.push(codec.encodeUByte(0));   // no converter
        }

        steps.push(codec.encodeUByte(0));     // raw data disabled

        return function() {
          return steps;
        }
      },
      encodeListenerId: function(listenerId) {
        return function() {
          return [codec.encodeString(listenerId)];     // listener id
        }
      },
      decodeEvent: function(header, bytebuf, listeners) {
        var common = DECODE_EVENT_COMMON(bytebuf);
        if (!f.existy(common))
            return false;
        
        var listenerId = common.listenerId;
        if (f.existy(listenerId)) {
          var decoderKey = decoderMedia(this.keyMediaType);
          var dispatcher = f.dispatch(
              f.isa(0x60, listeners.dispatchEvent('create', listenerId, bytebuf, emitCustomOr(common.isCustom, decoderKey, emitKeyVersion))),
              f.isa(0x61, listeners.dispatchEvent('modify', listenerId, bytebuf, emitCustomOr(common.isCustom, decoderKey, emitKeyVersion))),
              f.isa(0x62, listeners.dispatchEvent('remove', listenerId, bytebuf, emitCustomOr(common.isCustom, decoderKey, emitKey))),
              f.isa(0x63, listeners.dispatchEvent('expiry', listenerId, bytebuf, emitCustomOr(common.isCustom, decoderKey, emitKey)))
          );
          return dispatcher(header.opCode);
        }
        return true;
      }
    }
  }());

  var IteratorMixin = (function() { // protocol 2.3+
    var logger = u.logger('iterator');

    var DECODE_SEGMENTS_COUNT = f.actions(
        [codec.decodeVariableBytes(),     // segments byte array
         codec.decodeVInt()],             // number of entries
        function(values) {
          if (values.length < 2) {
            logger.tracef("Not enough to read (not array): %s", values);
            return undefined;
          }

          return {segments: values[0], count: values[1]}
        });
    var DECODE_VERSION = f.actions(
        [codec.decodeFixedBytes(8)],
        function(values) { return {version: values[0]}; });
    // var DECODE_VINT = f.actions([codec.decodeVInt()], codec.lastDecoded);

    return {
      encodeIterStart: function (batchSize, opts) {
        var meta = hasOpt(opts, 'metadata') ? 1 : 0;
        return function() {
          return [
            codec.encodeSignedInt(-1),    // segments
            codec.encodeSignedInt(-1),    // filter/converter factory
            codec.encodeVInt(batchSize),  // batch size
            codec.encodeUByte(meta)       // metadata
          ];
        }
      },
      encodeIterId: function(iterId) {
        return function() {
          return [codec.encodeString(iterId)];
        }
      },
      decodeIterId: function(header, bytebuf, conn) {
        var iterId = DECODE_STRING(bytebuf);
        return {result: {iterId: iterId, conn: conn}, continue: true};
      },
      decodeNextEntries: function() {
        var decoderKey = decoderMedia(this.keyMediaType);
        var decoderValue = decoderMedia(this.valueMediaType);
        return function(header, bytebuf) {
          var segmentsAndCount = DECODE_SEGMENTS_COUNT(bytebuf);
          if (!f.existy(segmentsAndCount))
            return {continue: false};

          var count = segmentsAndCount.count;
          logger.tracef('Iterator next contains %d entries', count);
          if (count > 0) {
            var projectionSize = DECODE_VINT(bytebuf); // projections size
            logger.tracef('Projection size is %d', projectionSize);
            if (!f.existy(projectionSize))
              return {continue: false};

            var entries = [], i = 0;
            while (i++ < count) {
              var meta = DECODE_UBYTE(bytebuf);
              if (!f.existy(meta))
                return {continue: false};

              var hasMeta = meta == 1;  // meta
              var entry = {};
              if (hasMeta) {
                var flags = DECODE_UBYTE(bytebuf);
                if (!f.existy(flags))
                  return {continue: false};

                var lifespan = decodeTimestamp(flags, INFINITE_LIFESPAN, ['created', 'lifespan'], bytebuf);
                if (!f.existy(lifespan))
                  return {continue: false};

                var idle = decodeTimestamp(flags, INFINITE_MAXIDLE, ['lastUsed', 'maxIdle'], bytebuf);
                if (!f.existy(idle))
                  return {continue: false};

                var version = DECODE_VERSION(bytebuf);
                entry = f.merge(lifespan, idle, version);
              }
              var kv = decodePairActions(decoderKey, decoderValue)(bytebuf);      // key/value pair
              if (f.existy(kv)) {
                entries.push(f.merge(entry, kv));
              } else {
                return {continue: false};
              }
            }
            return {result: entries, continue: true};
          }

          return {result: [], continue: true};
        }
      }
    }
  }());

  var NoListenerInterestsMixin = (function() {
    return {
      encodeListenerInterests: function (opts) {
        return [codec.encodeUByte(0x0F)]; // interested in all
      }
    }
  }());

  var ListenerInterestsMixin = (function() {
    return {
      encodeListenerInterests: function (opts) {
        return [codec.encodeUByte(0x0F)]; // interested in all
      }
    }
  }());

  var MediaType = function(mediaType) {
    var mediaCodecs = resolveEncoders(mediaType);

    function resolveEncoders(mediaType) {
      return f.dispatch(
        f.isa('application/json', encoder(2, encoderJson, decoderJson()))
        , f.isa('text/plain', encoder(13, encoderString, decoderString()))
        , f.isa('application/x-protostream', encoder(12, encoderProtobuf, decoderProtobuf()))
      )(mediaType);
    }

    function encoderJson(json) {
      return codec.encodeJSON(json);
    }

    function decoderJson() {
      return codec.decodeJSON();
    }

    function encoderString(str) {
      return codec.encodeString(str);
    }

    function decoderString() {
      return codec.decodeString();
    }

    function encoderProtobuf(message){
      return codec.encodeProtobuf(message,ProtostreamType.lookupProtostreamTypeByName);
    }

    function decoderProtobuf(){
      return f.partial2(codec.decodeProtobuf,ProtostreamType.lookupProtostreamTypeById,ProtobufRoot.findRootByTypeName)();
    }

    function encoder(id, mediaEncoder, mediaDecoder) {
      return function() {
        return [
          codec.encodeUByte(id)
          , mediaEncoder
          , mediaDecoder
        ];
      }
    }

    return {
      getMediaType: function() {
        return mediaType;
      },
      encodeMediaType: function() {
        return mediaCodecs[0];
      },
      encodeMedia: function(obj) {
        return mediaCodecs[1](obj);
      },
      decodeMedia: function() {
        return mediaCodecs[2];
      },
    };
  };

  var NoMediaTypesMixin = (function() {
    return {
      init: function(clientOpts) {
        this.keyMediaType = new MediaType('text/plain');
        this.valueMediaType = new MediaType('text/plain');
      },
      encodeMediaTypes: function () {
        return []; // no media types
      },
      encodeMediaKey: function(k) {
        return codec.encodeString(k);
      },
      encodeMediaValue: function(v) {
        return codec.encodeString(v);
      }
    }
  }());

  var MediaTypesMixin = (function() {
    function encodeMediaType(mediaType) {
      return [
        codec.encodeUByte(1)
        , mediaType.encodeMediaType()
        , codec.encodeUByte(0)
      ];
    }

    function decodeServerMediaType(bytebuf) {
      var mediaType = DECODE_UBYTE(bytebuf);
      if (!f.existy(mediaType))
        return {continue: false};

      if (_.isEqual(mediaType, 1)) {
        var decodePredefinedMediaType =
          f.actions([codec.decodeUByte(), codec.decodeVInt()], codec.allDecoded(2));
        var predefinedMediaType = decodePredefinedMediaType(bytebuf);
        if (!f.existy(predefinedMediaType))
          return {continue: false};
      }

      return {continue: true};
    }
    
    return {
      init: function(clientOpts) {
        logger.debugf("Before init, key media type was: %s"
          , f.existy(this.keyMediaType) ? this.keyMediaType.getMediaType() : 'undefined'
        );

        this.keyMediaType = new MediaType(clientOpts.dataFormat.keyType);
        this.valueMediaType = new MediaType(clientOpts.dataFormat.valueType);
        this.authOpts = clientOpts.authentication;

        logger.debugf("After init, key media type is: %s"
          , f.existy(this.keyMediaType) ? this.keyMediaType.getMediaType() : 'undefined'
        );
      },
      encodeMediaTypes: function() {
        var encodedKeyMediaType = encodeMediaType(this.keyMediaType);
        var encodedValueMediaType = encodeMediaType(this.valueMediaType);
        return f.cat(encodedKeyMediaType, encodedValueMediaType);
      },
      encodeMediaKey: function(k) {
        return this.keyMediaType.encodeMedia(k);
      },
      encodeMediaValue: function(v) {
        return this.valueMediaType.encodeMedia(v);
      },
      getKeyMediaType: function() {
        return this.keyMediaType.getMediaType();
      },
      getValueMediaType: function() {
        return this.valueMediaType.getMediaType();
      },
      decodeServerMediaTypes: function(header, bytebuf) {
        var keyMediaType = decodeServerMediaType(bytebuf);
        if (keyMediaType.continue) {
          var valueMediaType = decodeServerMediaType(bytebuf);
          if (valueMediaType.continue)
          
            return {result: undefined, continue: true};
        }
        return {continue: false};
      }
    }
  }());

  var SASLMixin = (function() {
    var logger = u.logger('sasl');
    return {
      decodeAuthMech: function(header, bytebuf) {
        var authMechsCount = DECODE_VINT(bytebuf);
        var authMechs = [], i = 0;
        while (i++ < authMechsCount) {
          var authMech = DECODE_STRING(bytebuf);
          if (f.existy(authMech)) {
            authMechs.push(authMech);
          } else {
            return {result: 'Unexpected error decoding auth mechanism ' + i, continue: false};
          }
        }
        logger.tracef(authMechs);
        return {result: authMechs, continue: true};
      },
      sasl: function(authOpts, holder) {
        logger.tracef(authOpts);
        return function () {
          var response;
          if (holder.mech == undefined) {
            holder.mech = factory.create([authOpts.saslMechanism]);
            if (holder.mech.clientFirst) {
              response = holder.mech.response({
                username: authOpts.userName, 
                password: authOpts.password, 
                mechanism: authOpts.saslMechanism,
                qop: 'auth',
                serviceType: 'hotrod', 
                host: 'infinispan'
              });
            } else {
              response = '';
            }
          } else {
            logger.tracef("SASL server challenge response [%s]", holder.mech.name);
            response = holder.mech.challenge(holder.challenge).response({
              username: authOpts.userName, 
              password: authOpts.password, 
              mechanism: authOpts.saslMechanism,
              qop: 'auth',
              serviceType: 'hotrod', 
              host: 'infinispan'
            });
          }
          logger.tracef("SASL client response [%s]", holder.mech.name);
          return [codec.encodeString(authOpts.saslMechanism), codec.encodeString(response)];
        }
      },
      decodeSasl: function(header, bytebuf) {
        var authDone = DECODE_UBYTE(bytebuf);
        if(authDone == 1) {
          logger.tracef('SASL authentication complete');
          return {result:  {response: DECODE_UBYTE(bytebuf)}, continue: true};
        } else {
          return {result:  {response: DECODE_STRING(bytebuf)}, continue: true};
        }
      }
    }
  }());

  var Ping29Mixin = (function() {
    return {
      decodePingResponse: function(header,bytebuf){
        logger.debugf("header and bytebuf %s %s",header,bytebuf);
        return MediaTypesMixin.decodeServerMediaTypes(header,bytebuf);
      }
    }
  }());

  var Ping30Mixin = (function() {
    return {
      decodePingResponse: function(header,bytebuf){
        var serverMediaTypes= MediaTypesMixin.decodeServerMediaTypes(header,bytebuf);
        var version=DECODE_UBYTE(bytebuf);
        var opCount=DECODE_VINT(bytebuf);
        var opRequestCodes=[];
        for(let i=0;i<opCount;i++){
          opRequestCodes.push(DECODE_SHORT(bytebuf));
        }
        return serverMediaTypes;
      }
    }
  }());

  var ProtostreamType = (function() {
    var protostreamTypes=[];
    return {
      registerProtostreamType: function(protostreamTypeName,protostreamDescriptorId){
        var protostreamType={
          protostreamTypeName,
          protostreamDescriptorId
        };
        protostreamTypes.push(protostreamType);
        return protostreamType;
      },
      lookupProtostreamTypeByName: function (protostreamTypeName) {
        return _.find(protostreamTypes,function(protostreamType){
          return _.isEqual(protostreamType.protostreamTypeName,protostreamTypeName)
        }).protostreamDescriptorId;
      },
      lookupProtostreamTypeById: function(protostreamDescriptorId){
        return _.find(protostreamTypes,function(protostreamType){
          return _.isEqual(protostreamType.protostreamDescriptorId,protostreamDescriptorId)
        }).protostreamTypeName;
      }
    }
  }());

  var ProtobufRoot = (function() {
    var protobufRoot;
    return {
      registerProtostreamRoot: function(root){
        protobufRoot=root;
        return protobufRoot;
      },
      findRootByTypeName: function(typeName){
        try{
          var root= protobufRoot.lookupType(typeName);
          return root;
        }catch(err){
          throw new Error("Protobuf root not found");
        }
      }
    }
  }());
  

  function Protocol(v, clientOpts) {
    this.version = v;
    this.clientOpts = clientOpts;
    this.init(clientOpts);
  }

  Protocol.prototype.init = _.identity;

  var Protocol25 = function(clientOpts) {
    Protocol.call(this, 25, clientOpts);
  };

  var Protocol22 = function(clientOpts) {
    Protocol.call(this, 22, clientOpts);
  };

  var Protocol29 = function(clientOpts) {
    Protocol.call(this, 29, clientOpts);
  };

  var Protocol30 = function(clientOpts) {
    Protocol.call(this, 30, clientOpts);
  };

  // TODO: Missing operations, just for reference
  var IdsMixin = {
    queryId: function() { return 0x1F },
    authMechId: function() { return 0x21 },
    authReqId: function() { return 0x23 }
  };

  _.extend(Protocol22.prototype
    , EncodeMixin
    , ExpiryEncodeMixin
    , DecodeMixin
    , IdsMixin
    , ListenersMixin
    , NoListenerInterestsMixin
    , NoMediaTypesMixin
    , ProtostreamType
    , ProtobufRoot
  );

  _.extend(Protocol25.prototype
      , EncodeMixin
      , ExpiryEncodeMixin
      , DecodeMixin
      , IdsMixin
      , ListenersMixin
      , NoListenerInterestsMixin
      , IteratorMixin
      , NoMediaTypesMixin
      , ProtostreamType
      , ProtobufRoot
  );

  _.extend(Protocol29.prototype
      , EncodeMixin
      , ExpiryEncodeMixin
      , DecodeMixin
      , IdsMixin
      , ListenersMixin
      , ListenerInterestsMixin
      , IteratorMixin
      , MediaTypesMixin
      , SASLMixin
      , Ping29Mixin
      , ProtostreamType
      , ProtobufRoot
      // TODO 2.6 new ops: getStream and putStream
      // TODO 2.6 add listener change: listener event interests
      // TODO 2.7 new ops: prepare, commit and rollback
      // TODO 2.7 new ops: counter operations
      // TODO 2.7 new events: counter events
      // TODO 2.8 listener events: can come from any connection
      // TODO 2.8 header change: media types
  );

  _.extend(Protocol30.prototype
    , EncodeMixin
    , ExpiryEncodeMixin
    , DecodeMixin
    , IdsMixin
    , ListenersMixin
    , ListenerInterestsMixin
    , IteratorMixin
    , MediaTypesMixin
    , SASLMixin
    , Ping30Mixin
    , ProtostreamType
    , ProtobufRoot
    // TODO 2.6 new ops: getStream and putStream
    // TODO 2.6 add listener change: listener event interests
    // TODO 2.7 new ops: prepare, commit and rollback
    // TODO 2.7 new ops: counter operations
    // TODO 2.7 new events: counter events
    // TODO 2.8 listener events: can come from any connection
    // TODO 2.8 header change: media types
);

  exports.version22 = function(clientOpts) {
    return new Protocol22(clientOpts);
  };

  exports.version25 = function(clientOpts) {
    return new Protocol25(clientOpts);
  };

  exports.version29 = function(clientOpts) {
    return new Protocol29(clientOpts);
  };

  exports.version30 = function(clientOpts) {
    return new Protocol30(clientOpts);
  };

}.call(this));
