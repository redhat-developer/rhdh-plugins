(function() {

  var _ = require('underscore');
  var log4js = require('log4js');
  var randomBytes = require('crypto').randomBytes;

  var f = require('./functional');

  exports.keyValueMap = function() { return new KeyValueMap(); };
  exports.logger = function(name) { return new ClientLogger(name); };
  exports.replayableBuffer = function() { return new ReplayableBuffer(); };
  exports.str = str;
  exports.normalizeAddresses = normalizeAddresses;
  exports.murmurHash3 = function() { return new MurmurHash3(); };
  exports.context = function(size) {
    return {buf: Buffer.alloc(size), offset: 0, id: parseInt(_.uniqueId()), triedAddrs: []};
  };
  exports.showAddress = function(addr) { return addr.host + ':' + addr.port; };
  exports.showArrayAddress = function(addrs) {
    return ["[", _.map(addrs, function(a) { return exports.showAddress(a); }).join(","), "]"].join('');
  };

  exports.parse = function (chal) {
    var dtives = {};
    var tokens = chal.split(/,(?=(?:[^"]|"[^"]*")*$)/);
    for (var i = 0, len = tokens.length; i < len; i++) {
      var dtiv = /(\w+)=["]?([^"]+)["]?$/.exec(tokens[i]);
      if (dtiv) {
        dtives[dtiv[1]] = dtiv[2];
      }
    }
    return dtives;
  };

  exports.saslname = function (name) {
    var escaped = [];
    var curr = '';
    for (var i = 0; i < name.length; i++) {
      curr = name[i];
      if (curr === ',') {
        escaped.push('=2C');
      } else if (curr === '=') {
        escaped.push('=3D');
      } else {
        escaped.push(curr);
      }
    }
    return escaped.join('');
  };

  exports.genNonce = function (len) {
    return randomBytes((len || 32) / 2).toString('hex');
  };

  var KeyValueMap = function() {
    var _map = Object.create(null);

    return {
      put: function(k, v) {
        _map[k] = v;
      },
      get: function(k) { // TODO: Return an Option or similar?
        return _map[k];
      },
      remove: function(k) {
        delete _map[k];
      },
      filter: function(f) {
        return _.pick(_map, f);
      },
      values: function() {
        return _.values(_map);
      }
    };
  };

  var ClientLogger = function(name) {
    var logger = log4js.getLogger(name);

    return {
      debugl: function(fun) {
        if (logger.isDebugEnabled())
          logger.debug.apply(logger, fun());
      },
      debugf: function() { logger.debug.apply(logger, arguments); },
      tracef: function() { logger.trace.apply(logger, arguments); },
      tracel: function(fun) {
        if (logger.isTraceEnabled())
          logger.trace.apply(logger, fun());
      },
      error: function() { logger.error.apply(logger, arguments); }
    }
  };

  var ReplayableBuffer = function() {
    var buf = Buffer.alloc(0);
    var offset = 0;
    var mark = 0;

    return {
      append: function(data) {
        var b = Buffer.alloc(buf.length + data.length);
        buf.copy(b, 0, 0, buf.length);
        data.copy(b, buf.length);
        buf = b;
      },
      trim: function(bytebuf) {
        buf = bytebuf.buf;
        offset = bytebuf.offset;
        if (buf.length >= offset) {
          buf = buf.slice(offset);
          offset = 0;
        }
      },
      isEmpty: function() {
        return buf.length == offset;
      },
      // Returns a byte buffer version
      mark: function() {
        mark = offset;
        return {buf: buf, offset: offset};
      },
      rewind: function() {
        offset = mark;
      },

      asBuffer: function() {
        var b = Buffer.alloc(buf.length);
        buf.copy(b);
        return b;
      }
    }
  };

  var polyToString = f.dispatch(
      function(s) { return !f.existy(s) ? 'undefined' : undefined },
      function(s) { return _.isString(s) ? (s.length > 1024 ? s.substring(0, 1024) + '...' : s) : undefined},
      function(s) { return _.isArray(s) ? stringifyArray(s) : undefined },
      function(s) { return _.isObject(s) ? JSON.stringify(s) : undefined },
      function(s) { return s.toString() });

  function str(o) {
    return polyToString(o);
  }

  function stringifyArray(ary) {
    return ["[", _.map(ary, polyToString).join(","), "]"].join('');
  }

  function normalizeAddresses(args) {
    var normalizer = f.dispatch(
        function(xs) { return _.isArray(xs) ? xs : undefined },
        function(x) { return _.isObject(x) ? [x] : undefined },
        function(x) {
          if (f.existy(x)) throw new Error('Unknown server addresses: ' + x);
          return [{port: 11222, host: '127.0.0.1'}]
        });
    return normalizer(args);
  }

  var MurmurHash3 = function() {
    function x64Xor(m, n) {
      // Given two 64bit ints (as an array of two 32bit ints) returns the two
      // xored together as a 64bit int (as an array of two 32bit ints).
      return [m[0] ^ n[0], m[1] ^ n[1]];
    }

    function x64Multiply(m, n) {
      // Given two 64bit ints (as an array of two 32bit ints) returns the two
      // multiplied together as a 64bit int (as an array of two 32bit ints).
      m = [m[0] >>> 16, m[0] & 0xffff, m[1] >>> 16, m[1] & 0xffff];
      n = [n[0] >>> 16, n[0] & 0xffff, n[1] >>> 16, n[1] & 0xffff];
      var o = [0, 0, 0, 0];

      o[3] += m[3] * n[3];
      o[2] += o[3] >>> 16;
      o[3] &= 0xffff;

      o[2] += m[2] * n[3];
      o[1] += o[2] >>> 16;
      o[2] &= 0xffff;

      o[2] += m[3] * n[2];
      o[1] += o[2] >>> 16;
      o[2] &= 0xffff;

      o[1] += m[1] * n[3];
      o[0] += o[1] >>> 16;
      o[1] &= 0xffff;

      o[1] += m[2] * n[2];
      o[0] += o[1] >>> 16;
      o[1] &= 0xffff;

      o[1] += m[3] * n[1];
      o[0] += o[1] >>> 16;
      o[1] &= 0xffff;

      o[0] += (m[0] * n[3]) + (m[1] * n[2]) + (m[2] * n[1]) + (m[3] * n[0]);
      o[0] &= 0xffff;

      return [(o[0] << 16) | o[1], (o[2] << 16) | o[3]];
    }

    function x64Rotl(m, n) {
      // Given a 64bit int (as an array of two 32bit ints) and an int
      // representing a number of bit positions, returns the 64bit int (as an
      // array of two 32bit ints) rotated left by that number of positions.
      n %= 64;

      if (n === 32)
        return [m[1], m[0]];
      else if (n < 32)
        return [(m[0] << n) | (m[1] >>> (32 - n)), (m[1] << n) | (m[0] >>> (32 - n))];
      else {
        n -= 32;
        return [(m[1] << n) | (m[0] >>> (32 - n)), (m[0] << n) | (m[1] >>> (32 - n))];
      }
    }

    function x64Add(m, n) {
      // Given two 64bit ints (as an array of two 32bit ints) returns the two
      // added together as a 64bit int (as an array of two 32bit ints).
      m = [m[0] >>> 16, m[0] & 0xffff, m[1] >>> 16, m[1] & 0xffff];
      n = [n[0] >>> 16, n[0] & 0xffff, n[1] >>> 16, n[1] & 0xffff];
      var o = [0, 0, 0, 0];

      o[3] += m[3] + n[3];
      o[2] += o[3] >>> 16;
      o[3] &= 0xffff;

      o[2] += m[2] + n[2];
      o[1] += o[2] >>> 16;
      o[2] &= 0xffff;

      o[1] += m[1] + n[1];
      o[0] += o[1] >>> 16;
      o[1] &= 0xffff;

      o[0] += m[0] + n[0];
      o[0] &= 0xffff;

      return [(o[0] << 16) | o[1], (o[2] << 16) | o[3]];
    }

    function x64LeftShift(m, n) {
      // Given a 64bit int (as an array of two 32bit ints) and an int
      // representing a number of bit positions, returns the 64bit int (as an
      // array of two 32bit ints) shifted left by that number of positions.
      n %= 64;

      if (n === 0)
        return m;
      else if (n < 32)
        return [(m[0] << n) | (m[1] >>> (32 - n)), m[1] << n];
      else
        return [m[1] << (n - 32), 0];
    }

    function getblock(key, i) {
      return [
        ((key[i + 4] & 0xff))
        | ((key[i + 5] & 0xff) << 8)
        | ((key[i + 6] & 0xff) << 16)
        | ((key[i + 7] & 0xff) << 24),
        ((key[i] & 0xff))
        | ((key[i + 1] & 0xff) << 8)
        | ((key[i + 2] & 0xff) << 16)
        | ((key[i + 3] & 0xff) << 24)
      ];
    }

    function bmix(state) {
      state.k1 = x64Multiply(state.k1, state.c1);
      state.k1 = x64Rotl(state.k1, 23);

      state.k1 = x64Multiply(state.k1, state.c2);
      state.h1 = x64Xor(state.h1, state.k1);
      state.h1 = x64Add(state.h1, state.h2);

      state.h2 = x64Rotl(state.h2, 41);

      state.k2 = x64Multiply(state.k2, state.c2);
      state.k2 = x64Rotl(state.k2, 23);
      state.k2 = x64Multiply(state.k2, state.c1);
      state.h2 = x64Xor(state.h2, state.k2);
      state.h2 = x64Add(state.h2, state.h1);

      state.h1 = x64Add(x64Multiply(state.h1, [0, 3]), [0, 0x52dce729]);
      state.h2 = x64Add(x64Multiply(state.h2, [0, 3]), [0, 0x38495ab5]);

      state.c1 = x64Add(x64Multiply(state.c1, [0, 5]), [0, 0x7b7d159c]);
      state.c2 = x64Add(x64Multiply(state.c2, [0, 5]), [0, 0x6bce6396]);
    }

    function x64Fmix(h) {
      // Given a block, returns murmurHash3's final x64 mix of that block.
      // (`[0, h[0] >>> 1]` is a 33 bit unsigned right shift. This is the
      // only place where we need to right shift 64bit ints.)
      h = x64Xor(h, [0, h[0] >>> 1]);
      h = x64Multiply(h, [0xff51afd7, 0xed558ccd]);
      h = x64Xor(h, [0, h[0] >>> 1]);
      h = x64Multiply(h, [0xc4ceb9fe, 0x1a85ec53]);
      h = x64Xor(h, [0, h[0] >>> 1]);
      return h;
    }

    // Used for debugging hashing
    function toHex(bignum) {
      var tmp0 = bignum[0] < 0 ? (bignum[0]>>>0) : bignum[0];
      var tmp1 = bignum[1] < 0 ? (bignum[1]>>>0) : bignum[1];
      return tmp0.toString(16) + tmp1.toString(16);
    }

    function _x32tox64(num) {
      return num < 0 ? [0xffffffff, num] : [0, num];
    }

    function murmurHash3_x64_64(key, seed) {
      var state = {};

      state.h1 = x64Xor([0x9368e53c, 0x2f6af274], seed);
      state.h2 = x64Xor([0x586dcd20, 0x8f7cd3fd], seed);

      state.c1 = [0x87c37b91, 0x114253d5];
      state.c2 = [0x4cf5ad43, 0x2745937f];

      for (var i = 0; i < Math.floor(key.length / 16); i++) {
        state.k1 = getblock(key, i * 2 * 8);
        state.k2 = getblock(key, (i * 2 + 1) * 8);
        bmix(state);
      }

      state.k1 = [0, 0];
      state.k2 = [0, 0];

      var tail = (key.length >>> 4) << 4;

      switch(key.length & 15) {
        case 15: state.k2 = x64Xor(state.k2,
                                    x64LeftShift(_x32tox64(key.readInt8(tail + 14)), 48));
        case 14: state.k2 = x64Xor(state.k2,
                                    x64LeftShift(_x32tox64(key.readInt8(tail + 13)), 40));
        case 13: state.k2 = x64Xor(state.k2,
                                    x64LeftShift(_x32tox64(key.readInt8(tail + 12)), 32));
        case 12: state.k2 = x64Xor(state.k2,
                                    x64LeftShift(_x32tox64(key.readInt8(tail + 11)), 24));
        case 11: state.k2 = x64Xor(state.k2,
                                    x64LeftShift(_x32tox64(key.readInt8(tail + 10)), 16));
        case 10: state.k2 = x64Xor(state.k2,
                                    x64LeftShift(_x32tox64(key.readInt8(tail + 9)), 8));
        case 9: state.k2 = x64Xor(state.k2, _x32tox64(key.readInt8(tail + 8)));

        case 8: state.k1 = x64Xor(state.k1,
                                   x64LeftShift(_x32tox64(key.readInt8(tail + 7)), 56));
        case 7: state.k1 = x64Xor(state.k1,
                                   x64LeftShift(_x32tox64(key.readInt8(tail + 6)), 48));
        case 6: state.k1 = x64Xor(state.k1,
                                   x64LeftShift(_x32tox64(key.readInt8(tail + 5)), 40));
        case 5: state.k1 = x64Xor(state.k1,
                                   x64LeftShift(_x32tox64(key.readInt8(tail + 4)), 32));
        case 4: state.k1 = x64Xor(state.k1,
                                   x64LeftShift(_x32tox64(key.readInt8(tail + 3)), 24));
        case 3: state.k1 = x64Xor(state.k1,
                                   x64LeftShift(_x32tox64(key.readInt8(tail + 2)), 16));
        case 2: state.k1 = x64Xor(state.k1,
                                   x64LeftShift(_x32tox64(key.readInt8(tail + 1)), 8));
        case 1:
          state.k1 = x64Xor(state.k1, _x32tox64(key.readInt8(tail)));
          bmix(state);
      }

      state.h2 = x64Xor(state.h2, [0, key.length]);

      state.h1 = x64Add(state.h1, state.h2);
      state.h2 = x64Add(state.h2, state.h1);

      state.h1 = x64Fmix(state.h1);
      state.h2 = x64Fmix(state.h2);

      state.h1 = x64Add(state.h1, state.h2);
      state.h2 = x64Add(state.h2, state.h1);

      return state.h1;
    }

    return {
      hash: function(key) {
        var h = murmurHash3_x64_64(key, [0, 9001]);
        return h[0] >>> 32;
      }
    }
  }

}.call(this));
