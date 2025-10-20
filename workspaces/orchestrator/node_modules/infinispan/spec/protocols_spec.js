'use strict';

var _ = require('underscore');
var f = require('../lib/functional');
var codec = require('../lib/codec');

var t = require('./utils/testing'); // Testing dependency

var singleExpiryDecode = f.actions([codec.decodeUByte(), codec.decodeVLong()], codec.allDecoded(2));
var constantExpiryDecode = f.actions([codec.decodeUByte()], codec.allDecoded(1));

function lifespan(unit) { return unit << 4 | 0x07; }
function maxIdle(unit) { return 0x70 | unit; }

function object(name) {
  return function(value) {
    return _.object([name], [value]);
  }
}

describe('Protocols', function() {
  var p = t.protocol25();

  it('can encode/decode lifespan', function() {
    encodeDecodeUnits('lifespan', lifespan);
  });
  it('can encode/decode max idle', function() {
    encodeDecodeUnits('maxIdle', maxIdle);
  });
  it('connects with undefined HotRod Protocol', function (done) {
    t.expectToThrow(function () {
      t.client(t.local_notsecured, {version: '1.1'});
    }, 'Unknown protocol version: 1.1', done);
  });
  it('can handle different protocols at the same time', function() {
    var p1 = t.protocol29({
      dataFormat : {
        keyType: 'text/plain',
        valueType: 'text/plain'
      }
    });
    var p2 = t.protocol29({
      dataFormat : {
        keyType: 'application/json',
        valueType: 'application/json'
      }
    });

    expect(p1.clientOpts.dataFormat.keyType).toEqual('text/plain');
    expect(p1.getKeyMediaType()).toEqual('text/plain');
    expect(p1.getValueMediaType()).toEqual('text/plain');

    expect(p2.clientOpts.dataFormat.keyType).toEqual('application/json');
    expect(p2.getKeyMediaType()).toEqual('application/json');
    expect(p2.getValueMediaType()).toEqual('application/json');
  });

  function encodeDecodeUnits(name, converter) {
    var exp = object(name);
    encodeDecodeSingleNumericExpiry(exp('777777777d'), 777777777, converter(0x06));
    encodeDecodeSingleNumericExpiry(exp('66666666h'), 66666666, converter(0x05));
    encodeDecodeSingleNumericExpiry(exp('5555555m'), 5555555, converter(0x04));
    encodeDecodeSingleNumericExpiry(exp('444444s'), 444444, converter(0x00));
    encodeDecodeSingleNumericExpiry(exp('33333ms'), 33333, converter(0x01));
    encodeDecodeSingleNumericExpiry(exp('2222μs'), 2222, converter(0x03));
    encodeDecodeSingleNumericExpiry(exp('111ns'), 111, converter(0x02));
    encodeDecodeSingleConstantExpiry(exp(0), converter(0x07));
    encodeDecodeSingleConstantExpiry(exp(-1), converter(0x08));
  }

  function encodeDecodeSingleNumericExpiry(expiry, duration, unit) {
    var encoder = f.actions(p.encodeExpiry(expiry), codec.bytesEncoded);
    var bytebuf = t.assertEncode(t.newByteBuf(), encoder, t.vNumSize(duration) + 1);
    expect(singleExpiryDecode({buf: bytebuf.buf, offset: 0})).toEqual([unit, duration]);
  }

  function encodeDecodeSingleConstantExpiry(expiry, unit) {
    var encoder = f.actions(p.encodeExpiry(expiry), codec.bytesEncoded);
    var bytebuf = t.assertEncode(t.newByteBuf(), encoder, 1);
    expect(constantExpiryDecode({buf: bytebuf.buf, offset: 0})).toEqual([unit]);
  }
});
