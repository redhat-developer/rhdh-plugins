
var test = require('tap').test;
var summary = require('./summary.js');

test('testing data method', function (t) {
  t.deepEqual(
    summary([2, 3, 7, -2, 0, 1, 1]).data(),
    [2, 3, 7, -2, 0, 1, 1]
  );

  t.end();
});

test('testing sort method', function (t) {
  const data = [2, 3, 7, -2, 0, 1, 1];

  t.deepEqual(
    summary(data, true).sort(),
    [2, 3, 7, -2, 0, 1, 1]
  );
  t.deepEqual(data, [2, 3, 7, -2, 0, 1, 1], 'data shouldn\'t mutate');

  t.deepEqual(
    summary(data, false).sort(),
    [-2, 0, 1, 1, 2, 3, 7]
  );
  t.deepEqual(data, [2, 3, 7, -2, 0, 1, 1], 'data shouldn\'t mutate');

  t.deepEqual(
    summary(data).sort(),
    [-2, 0, 1, 1, 2, 3, 7]
  );
  t.deepEqual(data, [2, 3, 7, -2, 0, 1, 1], 'data shouldn\'t mutate');

  t.end();
});

test('testing sort method when cached', function (t) {
  const s = summary([2, 3, 7, -2, 0, 1, 1]);

  t.deepEqual(s.sort(), [-2, 0, 1, 1, 2, 3, 7]);
  t.deepEqual(s.sort(), [-2, 0, 1, 1, 2, 3, 7]);

  t.end();
});

test('testing size method', function (t) {
  t.equal(
    summary([1, 10]).size(),
    2
  );

  t.end();
});

test('testing sum method', function (t) {
  t.equal(
    summary([1, 10]).sum(),
    11
  );

  t.end();
});

test('testing sum for variable lengths', function (t) {
  const data = [];
  for (let i = 0; i < 256; i++) {
    data.push(i);
    t.equal(summary(data).sum(), (i**2 + i) / 2);
  }
  t.end();
});

test('testing sum method when cached', function (t) {
  const s = summary([1, 10]);
  t.equal(s.sum(), 11);
  t.equal(s.sum(), 11);
  t.end();
});

test('testing mode method', function (t) {
  t.equal(
    summary([10, 11, 12, 11, 12, 7, 12]).mode(),
    12
  );

  t.equal(
    summary([10, 13, 12, 13, 12, 13, 12]).mode(),
    13
  );

  t.equal(
    summary([1, 2, 2, 3, 3, 3, 4]).mode(),
    3
  );

  t.equal(
    summary([1, 2, 2, 3, 3, 4]).mode(),
    3
  );

  t.equal(
    summary([1, 2, 2, 2, 3, 3, 4]).mode(),
    2
  );

  t.equal(
    summary([1, 2, 3]).mode(),
    3
  );

  t.end();
});

test('testing mode method when cached', function (t) {
  const s = summary([1, 2, 3]);
  t.equal(s.mode(), 3);
  t.equal(s.mode(), 3);
  t.end();
});

test('testing mean method', function (t) {
  t.equal(
    summary([2, 4]).mean(),
    3
  );

  t.end();
});

test('testing mean method when cached', function (t) {
  const s = summary([2, 4]);
  t.equal(s.mean(), 3);
  t.equal(s.mean(), 3);
  t.end();
});

test('testing quartile method', function (t) {
  var data = summary([
    2, 27, 10, 29, 16, 8, 5, 19, 2, 2, 18,28,
    7, 28, 28, 25, 19, 14, 18, 21, 25, 29, 7,
    3, 21, 3, 24, 18, 12, 25
  ]);

  t.equal(data.quartile(0.00), 2.00);
  t.equal(data.quartile(0.13), 3.00);
  t.equal(data.quartile(0.26), 7.00);
  t.equal(data.quartile(0.39), 14.0);
  t.equal(data.quartile(0.52), 18.0);
  t.equal(data.quartile(0.65), 21.0);
  t.equal(data.quartile(0.78), 25.0);
  t.equal(data.quartile(0.91), 28.0);
  t.equal(data.quartile(1.00), 29.0);

  // when cached
  t.equal(data.quartile(0.00), 2.00);
  t.equal(data.quartile(0.13), 3.00);
  t.equal(data.quartile(0.26), 7.00);
  t.equal(data.quartile(0.39), 14.0);
  t.equal(data.quartile(0.52), 18.0);
  t.equal(data.quartile(0.65), 21.0);
  t.equal(data.quartile(0.78), 25.0);
  t.equal(data.quartile(0.91), 28.0);
  t.equal(data.quartile(1.00), 29.0);

  t.end();
});

test('testing median method', function (t) {
  var data = summary([
    2, 27, 10, 29, 16, 8, 5, 19, 2, 2, 18,28,
    7, 28, 28, 25, 19, 14, 18, 21, 25, 29, 7,
    3, 21, 3, 24, 18, 12, 25
  ]);

  t.equal(data.median(), 18);
  // when cached
  t.equal(data.median(), 18);

  t.end();
});


test('testing variance method', function (t) {
  t.equal(summary([-2, -1, 0, 1, 2]).variance(), 2.5);

  t.end();
});


test('testing variance method when cached', function (t) {
  const s = summary([-2, -1, 0, 1, 2]);
  t.equal(s.variance(), 2.5);
  t.equal(s.variance(), 2.5);
  t.end();
});

test('testing sd method', function (t) {
  t.equal(summary([-2, -1, 0, 1, 2]).sd(), Math.sqrt(2.5));

  t.end();
});

test('testing sd method when cached', function (t) {
  const s = summary([-2, -1, 0, 1, 2]);
  t.equal(s.sd(), Math.sqrt(2.5));
  t.equal(s.sd(), Math.sqrt(2.5));

  t.end();
});

test('testing max method', function (t) {
  t.equal(summary([6, 10, 2, 5]).max(), 10);

  t.end();
});

test('testing max method when cached', function (t) {
  const s = summary([6, 10, 2, 5]);
  t.equal(s.max(), 10);
  t.equal(s.max(), 10);

  t.end();
});

test('testing min method', function (t) {
  t.equal(summary([6, 10, 2, 5]).min(), 2);

  t.end();
});

test('testing min method when cached', function (t) {
  const s = summary([6, 10, 2, 5]);
  t.equal(s.min(), 2);
  t.equal(s.min(), 2);

  t.end();
});

test('typed array', function (t) {
  t.equal(summary(new Int8Array([2, 4])).mean(), 3);

  t.end();
});

test('not array', function (t) {
  t.throws(() => summary({ length: 0 }), TypeError);

  t.end();
});
