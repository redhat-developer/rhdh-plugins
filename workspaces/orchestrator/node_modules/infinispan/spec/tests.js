var t = require('./utils/testing'); // Testing dependency

exports.execPutGet = function(path, prefix, client, expectFun) {
  return function(done) {
    var scriptName = prefix + '-typed-put-get.js';
    var params = {k: prefix + '-typed-key', v: prefix + '-typed-value'};
    client
      .then(t.loadAndExec(path, scriptName))
      .then(t.assert(t.exec(scriptName, params), expectFun))
      .then(t.assert(t.get(prefix + "-typed-key"), t.toBe(prefix + "-typed-value")))
      .catch(t.failed(done)).finally(done);
  }
};

 exports.iterateEntries = function(prefix, batchSize, client) {
  return function(done) {
    var pairs = [
      {key: prefix + '-it1', value: 'v1', done: false},
      {key: prefix + '-it2', value: 'v2', done: false},
      {key: prefix + '-it3', value: 'v3', done: false}];
    client
      .then(t.assert(t.clear()))
      .then(t.assert(t.putAll(pairs), t.toBeUndefined))
      .then(t.seqIterator('key', batchSize, pairs))
      .catch(t.failed(done))
      .finally(done);
  }
};
