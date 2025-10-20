var t = require('./utils/testing'); // Testing dependency

describe('Infinispan JSON client', function() {
  var client = t.client(t.local, t.json);

    beforeEach(function (done) {
      client
        .then(t.assert(t.clear()))
        .catch(t.failed(done)).finally(done);
    });

    it('can put -> get -> remove a key/value pair', function (done) {
      client
        .then(t.assert(t.put({k: 'jkey'}, {v: 'jvalue'})))
        .then(t.assert(t.get({k: 'jkey'}), t.toEqual({v: 'jvalue'})))
        .then(t.assert(t.containsKey({k: 'jkey'}), t.toBeTruthy))
        .then(t.assert(t.remove({k: 'jkey'}), t.toBeTruthy))
        .catch(t.failed(done))
        .finally(done);
    });
    it('can use conditional operations on a key/value pair', function (done) {
      client
        .then(t.assert(t.putIfAbsent({k: 'jcond'}, {v: 'jv0'}), t.toBeTruthy))
        .then(t.assert(t.replace({k: 'jcond'}, {v: 'jv1'}), t.toBeTruthy))
        .then(t.assert(t.conditional(
          t.replaceV, t.getM, {k: 'jcond'}, {v: 'jv1'}, {v: 'jv2'}), t.toBeTruthy)
        )
        .then(t.assert(t.conditional(
          t.removeWithVersion, t.getM, {k: 'jcond'}, {v: 'jv2'}), t.toBeTruthy)
        )
        .catch(t.failed(done))
        .finally(done);
    });
    it('can return previous values', function (done) {
      client
        .then(t.assert(t.putIfAbsent({k: 'jprev'}, {v: 'jv0'}, t.prev()), t.toBeUndefined))
        .then(t.assert(t.putIfAbsent({k: 'jprev'}, {v: 'jv1'}, t.prev()), t.toEqual({v: 'jv0'})))
        .then(t.assert(t.remove({k: 'jprev'}, t.prev()), t.toEqual({v: 'jv0'})))
        .then(t.assert(t.put({k: 'jprev'}, {v: 'jv1'}, t.prev()), t.toBeUndefined))
        .then(t.assert(t.put({k: 'jprev'}, {v: 'jv2'}, t.prev()), t.toEqual({v: 'jv1'})))
        .then(t.assert(t.replace({k: 'jprev'}, {v: 'jv3'}, t.prev()), t.toEqual({v: 'jv2'})))
        .then(t.assert(
          t.conditional(t.replaceV, t.getM, {k: 'jprev'}, {v: 'jv3'}, {v: 'jv4'}, t.prev())
          , t.toEqual({v: 'jv3'})))
        .then(t.assert(
          t.conditional(t.removeWithVersion, t.getM, {k: 'jprev'}, {v: 'jv4'}, t.prev())
          , t.toEqual({v: 'jv4'})))
        .catch(t.failed(done))
        .finally(done);
    });
    it('can use multi-key operations', function (done) {
      var pairs = [
        {key: {mk: 'jmulti1'}, value: {mv: 'jv1'}}
        , {key: {mk: 'jmulti2'}, value: {mv: 'jv2'}}
        , {key: {mk: 'jmulti3'}, value: {mv: 'jv3'}}
      ];
      var keys = [{mk: 'jmulti1'}, {mk: 'jmulti2'}];
      client
        .then(t.assert(t.putAll(pairs), t.toBeUndefined))
        .then(t.assert(t.getAll(keys)
          , t.toEqualPairs(
            function (obj) {
              return obj.key.mk;
            }
            , [{
              key: {mk: 'jmulti1'},
              value: {mv: 'jv1'}
            }, {key: {mk: 'jmulti2'}, value: {mv: 'jv2'}}]
          )))
        .catch(t.failed(done))
        .finally(done);
    });
    it('can listen for only create events', function (done) {
      client
        .then(t.on('create', t.expectEvent({k: 'jlisten-create'}, done, true, {v: 'jvalue'})))
        .then(t.assert(t.putIfAbsent({k: 'jlisten-create'}, {v: 'jvalue'}), t.toBeTruthy))
        .catch(t.failed(done));
    });
    it('can listen for only modified events', function (done) {
      client
        .then(t.on('modify', t.expectEvent({k: 'jlisten-modify'}, done, true, {v: 'jv1'})))
        .then(t.assert(t.putIfAbsent({k: 'jlisten-modify'}, {v: 'jv0'}), t.toBeTruthy))
        .then(t.assert(t.replace({k: 'jlisten-modify'}, {v: 'jv1'}), t.toBeTruthy))
        .catch(t.failed(done));
    });
    it('can listen for only removed events', function (done) {
      client
        .then(t.on('remove', t.expectEvent({k: 'jlisten-remove'}, done, true)))
        .then(t.assert(t.putIfAbsent({k: 'jlisten-remove'}, {v: 'jv0'}), t.toBeTruthy))
        .then(t.assert(t.replace({k: 'jlisten-remove'}, {v: 'jv1'}), t.toBeTruthy))
        .then(t.assert(t.remove({k: 'jlisten-remove'}), t.toBeTruthy))
        .catch(t.failed(done));
    });
    it('can listen for custom events for created events', function(done) {
      var expected = { _type : 'org.infinispan.commons.util.KeyValueWithPrevious', key : {"k":"jlisten-custom"}, value : {"v":"jvalue"}, prev : null };
      var opts = { converterFactory : { name: "key-value-with-previous-converter-factory" } };
      client
        .then(t.on('create', t.expectCustomEvent(expected, done), opts))
        .then(t.assert(t.putIfAbsent({k: 'jlisten-custom'}, {v: 'jvalue'}), t.toBeTruthy))
        .catch(t.failed(done));
    });
    it('can listen for custom events for modified events', function (done) {
      var expected = { _type : 'org.infinispan.commons.util.KeyValueWithPrevious', key : {"k":"jlisten-modify"}, value : {"v":"jv1"}, prev : {"v":"jv0"} };
      var opts = { converterFactory : { name: "key-value-with-previous-converter-factory" } };
      client
        .then(t.on('modify', t.expectCustomEvent(expected, done), opts))
        .then(t.assert(t.putIfAbsent({k: 'jlisten-modify'}, {v: 'jv0'}), t.toBeTruthy))
        .then(t.assert(t.replace({k: 'jlisten-modify'}, {v: 'jv1'}), t.toBeTruthy))
        .catch(t.failed(done));
    });
    it('can listen for custom events for removed events', function (done) {
      var expected = { _type : 'org.infinispan.commons.util.KeyValueWithPrevious', key : {"k":"jlisten-remove"}, value : null, prev : {"v":"jv1"} };
      var opts = { converterFactory : { name: "key-value-with-previous-converter-factory" } };
      client
        .then(t.on('remove', t.expectCustomEvent(expected, done), opts))
        .then(t.assert(t.putIfAbsent({k: 'jlisten-remove'}, {v: 'jv0'}), t.toBeTruthy))
        .then(t.assert(t.replace({k: 'jlisten-remove'}, {v: 'jv1'}), t.toBeTruthy))
        .then(t.assert(t.remove({k: 'jlisten-remove'}), t.toBeTruthy))
        .catch(t.failed(done));
    });

      it('can iterate over entries, one entry at the time', function (done) {
        var pairs = [
          {key: {k: 'jlocal-it1'}, value: {v: 'jv1'}, done: false},
          {key: {k: 'jlocal-it2'}, value: {v: 'jv2'}, done: false},
          {key: {k: 'jlocal-it3'}, value: {v: 'jv3'}, done: false}];
        client
          .then(t.assert(t.clear()))
          .then(t.assert(t.putAll(pairs), t.toBeUndefined))
          .then(t.seqIterator(function (obj) {
            return obj.key.k;
          }, 1, pairs))
          .catch(t.failed(done))
          .finally(done);
      });

    // it('can execute a script remotely to store and retrieve data', function(done) {
    //   var scriptName = 'local-typed-json-put-get.js';
    //   var params = {k: {ek: 'local-json-typed-key'}, v: {ev: 'local-json-typed-value'}};
    //   client
    //     .then(t.loadAndExec('spec/utils/typed-json-put-get.js', scriptName))
    //     .then(t.assert(t.exec(scriptName, params), t.toEqual({ev: 'local-json-typed-value'})))
    //     // .then(t.assert(t.get(prefix + "-typed-key"), t.toBe(prefix + "-typed-value")))
    //     .catch(t.failed(done)).finally(done);
    //   }
    // );
    // it('can execute a script remotely to store and retrieve unicode data', function(done) {
    //   client
    //     .then(t.loadAndExec('spec/utils/typed-json-put-get-unicode.js', 'typed-json-put-get-unicode.js'))
    //     .then(t.assert(t.exec('typed-json-put-get-unicode.js'), t.toEqual({v: 'բարեվ'})))
    //     .catch(t.failed(done)).finally(done);
    // });
    // it('can execute a script remotely that returns size', function(done) {
    //   client
    //       .then(t.loadAndExec('spec/utils/typed-json-size.js'))
    //       .then(t.assert(t.exec('typed-json-size.js'), t.toEqual({size: '0'})))
    //       .catch(t.failed(done)).finally(done);
    // });
    // it('can execute a script remotely that returns undefined', function(done) {
    //   client
    //       .then(t.loadAndExec('spec/utils/typed-json-null-return.js'))
    //       .then(t.assert(t.exec('typed-json-null-return.js'), t.toEqual({address: ''})))
    //       .catch(t.failed(done)).finally(done);
    // });

    // it('can listen for events generated by executing a script', function(done) {
    //   client
    //       .then(t.on('create', t.expectEvent('listen-typed-key', done, true, 'listen-typed-value')))
    //       .then(t.loadAndExec('spec/utils/typed-put-get.js'))
    //       .then(t.assert(t.exec('typed-put-get.js'
    //           , {k: 'listen-typed-key', v: 'listen-typed-value'}), t.toBe('listen-typed-value')))
    //       .catch(t.failed(done));
    // });

  // Since Jasmine 1.3 does not have afterAll callback, this disconnect test must be last
  it('disconnects client', function(done) { client
      .then(t.disconnect())
      .catch(t.failed(done))
      .finally(done);
  });

});