var test = require('tape');
var concatBuffers = require('./');

test('concat 2 buffers', function(t) {
  var b = concatBuffers(new Uint8Array([1, 2]), new Uint8Array([3, 4, 5]));
  t.equal(b[0], 1);
  t.equal(b[1], 2);
  t.equal(b[2], 3);
  t.equal(b[3], 4);
  t.equal(b[4], 5);
  t.equal(b.byteLength, 5);
  t.end();
});

test('concat other 2 buffers', function(t) {
  var b = concatBuffers(new Uint8Array([4, 5, 7]), new Uint8Array([1]));
  t.equal(b[0], 4);
  t.equal(b[1], 5);
  t.equal(b[2], 7);
  t.equal(b[3], 1);
  t.equal(b.byteLength, 4);
  t.end();
});

test('concat 2 buffers as array', function(t) {
  var b = concatBuffers([new Uint8Array([1]), new Uint8Array([1, 2])]);
  t.equal(b[0], 1);
  t.equal(b[1], 1);
  t.equal(b[2], 2);
  t.equal(b.byteLength, 3);
  t.end();
});

test('concat all empty buffers', function(t) {
  var b = concatBuffers([new Uint8Array(), new Uint8Array(), new Uint8Array()]);
  t.equal(b.byteLength, 0);
  t.end();
});

test('concat few empty buffers', function(t) {
  var b = concatBuffers([new Uint8Array(), new Uint8Array([1, 2]), new Uint8Array()]);
  t.equal(b[0], 1);
  t.equal(b[1], 2);
  t.equal(b.byteLength, 2);
  t.end();
});

test('concat empty array', function(t) {
  var b = concatBuffers([]);
  t.equal(b.byteLength, 0);
  t.end();
});

test('concat empty argument list', function(t) {
  var b = concatBuffers();
  t.equal(b.byteLength, 0);
  t.end();
});
