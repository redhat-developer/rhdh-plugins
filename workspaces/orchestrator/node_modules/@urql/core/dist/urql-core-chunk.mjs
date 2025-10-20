import { GraphQLError as e, print as r, parse as t, Kind as a } from "@0no-co/graphql.web";

import { onEnd as o, filter as n, fromAsyncIterable as s } from "wonka";

var rehydrateGraphQlError = r => {
  if (r && r.message && (r.extensions || "GraphQLError" === r.name)) {
    return r;
  } else if ("object" == typeof r && r.message) {
    return new e(r.message, r.nodes, r.source, r.positions, r.path, r, r.extensions || {});
  } else {
    return new e(r);
  }
};

class CombinedError extends Error {
  constructor(e) {
    var r = (e.graphQLErrors || []).map(rehydrateGraphQlError);
    var t = ((e, r) => {
      var t = "";
      if (e) {
        return `[Network] ${e.message}`;
      }
      if (r) {
        for (var a of r) {
          if (t) {
            t += "\n";
          }
          t += `[GraphQL] ${a.message}`;
        }
      }
      return t;
    })(e.networkError, r);
    super(t);
    this.name = "CombinedError";
    this.message = t;
    this.graphQLErrors = r;
    this.networkError = e.networkError;
    this.response = e.response;
  }
  toString() {
    return this.message;
  }
}

var phash = (e, r) => {
  var t = 0 | (r || 5381);
  for (var a = 0, o = 0 | e.length; a < o; a++) {
    t = (t << 5) + t + e.charCodeAt(a);
  }
  return t;
};

var i = new Set;

var f = new WeakMap;

var stringify = e => {
  if (null === e || i.has(e)) {
    return "null";
  } else if ("object" != typeof e) {
    return JSON.stringify(e) || "";
  } else if (e.toJSON) {
    return stringify(e.toJSON());
  } else if (Array.isArray(e)) {
    var r = "[";
    for (var t of e) {
      if (r.length > 1) {
        r += ",";
      }
      r += stringify(t) || "null";
    }
    return r += "]";
  } else if (l !== NoopConstructor && e instanceof l || c !== NoopConstructor && e instanceof c) {
    return "null";
  }
  var a = Object.keys(e).sort();
  if (!a.length && e.constructor && Object.getPrototypeOf(e).constructor !== Object.prototype.constructor) {
    var o = f.get(e) || Math.random().toString(36).slice(2);
    f.set(e, o);
    return stringify({
      __key: o
    });
  }
  i.add(e);
  var n = "{";
  for (var s of a) {
    var d = stringify(e[s]);
    if (d) {
      if (n.length > 1) {
        n += ",";
      }
      n += stringify(s) + ":" + d;
    }
  }
  i.delete(e);
  return n += "}";
};

var extract = (e, r, t) => {
  if (null == t || "object" != typeof t || t.toJSON || i.has(t)) {} else if (Array.isArray(t)) {
    for (var a = 0, o = t.length; a < o; a++) {
      extract(e, `${r}.${a}`, t[a]);
    }
  } else if (t instanceof l || t instanceof c) {
    e.set(r, t);
  } else {
    i.add(t);
    for (var n of Object.keys(t)) {
      extract(e, `${r}.${n}`, t[n]);
    }
  }
};

var stringifyVariables = e => {
  i.clear();
  return stringify(e);
};

class NoopConstructor {}

var l = "undefined" != typeof File ? File : NoopConstructor;

var c = "undefined" != typeof Blob ? Blob : NoopConstructor;

var d = /("{3}[\s\S]*"{3}|"(?:\\.|[^"])*")/g;

var v = /(?:#[^\n\r]+)?(?:[\r\n]+|$)/g;

var replaceOutsideStrings = (e, r) => r % 2 == 0 ? e.replace(v, "\n") : e;

var sanitizeDocument = e => e.split(d).map(replaceOutsideStrings).join("").trim();

var p = new Map;

var u = new Map;

var stringifyDocument = e => {
  var t;
  if ("string" == typeof e) {
    t = sanitizeDocument(e);
  } else if (e.loc && u.get(e.__key) === e) {
    t = e.loc.source.body;
  } else {
    t = p.get(e) || sanitizeDocument(r(e));
    p.set(e, t);
  }
  if ("string" != typeof e && !e.loc) {
    e.loc = {
      start: 0,
      end: t.length,
      source: {
        body: t,
        name: "gql",
        locationOffset: {
          line: 1,
          column: 1
        }
      }
    };
  }
  return t;
};

var hashDocument = e => {
  var r = phash(stringifyDocument(e));
  if (e.definitions) {
    var t = getOperationName(e);
    if (t) {
      r = phash(`\n# ${t}`, r);
    }
  }
  return r;
};

var keyDocument = e => {
  var r;
  var a;
  if ("string" == typeof e) {
    r = hashDocument(e);
    a = u.get(r) || t(e, {
      noLocation: !0
    });
  } else {
    r = e.__key || hashDocument(e);
    a = u.get(r) || e;
  }
  if (!a.loc) {
    stringifyDocument(a);
  }
  a.__key = r;
  u.set(r, a);
  return a;
};

var createRequest = (e, r, t) => {
  var a = r || {};
  var o = keyDocument(e);
  var n = stringifyVariables(a);
  var s = o.__key;
  if ("{}" !== n) {
    s = phash(n, s);
  }
  return {
    key: s,
    query: o,
    variables: a,
    extensions: t
  };
};

var getOperationName = e => {
  for (var r of e.definitions) {
    if (r.kind === a.OPERATION_DEFINITION) {
      return r.name ? r.name.value : void 0;
    }
  }
};

var getOperationType = e => {
  for (var r of e.definitions) {
    if (r.kind === a.OPERATION_DEFINITION) {
      return r.operation;
    }
  }
};

var makeResult = (e, r, t) => {
  if (!("data" in r || "errors" in r && Array.isArray(r.errors))) {
    throw new Error("No Content");
  }
  var a = "subscription" === e.kind;
  return {
    operation: e,
    data: r.data,
    error: Array.isArray(r.errors) ? new CombinedError({
      graphQLErrors: r.errors,
      response: t
    }) : void 0,
    extensions: r.extensions ? {
      ...r.extensions
    } : void 0,
    hasNext: null == r.hasNext ? a : r.hasNext,
    stale: !1
  };
};

var deepMerge = (e, r) => {
  if ("object" == typeof e && null != e) {
    if (!e.constructor || e.constructor === Object || Array.isArray(e)) {
      e = Array.isArray(e) ? [ ...e ] : {
        ...e
      };
      for (var t of Object.keys(r)) {
        e[t] = deepMerge(e[t], r[t]);
      }
      return e;
    }
  }
  return r;
};

var mergeResultPatch = (e, r, t, a) => {
  var o = e.error ? e.error.graphQLErrors : [];
  var n = !!e.extensions || !!(r.payload || r).extensions;
  var s = {
    ...e.extensions,
    ...(r.payload || r).extensions
  };
  var i = r.incremental;
  if ("path" in r) {
    i = [ r ];
  }
  var f = {
    data: e.data
  };
  if (i) {
    var _loop = function(e) {
      if (Array.isArray(e.errors)) {
        o.push(...e.errors);
      }
      if (e.extensions) {
        Object.assign(s, e.extensions);
        n = !0;
      }
      var r = "data";
      var t = f;
      var i = [];
      if (e.path) {
        i = e.path;
      } else if (a) {
        var l = a.find((r => r.id === e.id));
        if (e.subPath) {
          i = [ ...l.path, ...e.subPath ];
        } else {
          i = l.path;
        }
      }
      for (var c = 0, d = i.length; c < d; r = i[c++]) {
        t = t[r] = Array.isArray(t[r]) ? [ ...t[r] ] : {
          ...t[r]
        };
      }
      if (e.items) {
        var v = +r >= 0 ? r : 0;
        for (var p = 0, u = e.items.length; p < u; p++) {
          t[v + p] = deepMerge(t[v + p], e.items[p]);
        }
      } else if (void 0 !== e.data) {
        t[r] = deepMerge(t[r], e.data);
      }
    };
    for (var l of i) {
      _loop(l);
    }
  } else {
    f.data = (r.payload || r).data || e.data;
    o = r.errors || r.payload && r.payload.errors || o;
  }
  return {
    operation: e.operation,
    data: f.data,
    error: o.length ? new CombinedError({
      graphQLErrors: o,
      response: t
    }) : void 0,
    extensions: n ? s : void 0,
    hasNext: null != r.hasNext ? r.hasNext : e.hasNext,
    stale: !1
  };
};

var makeErrorResult = (e, r, t) => ({
  operation: e,
  data: void 0,
  error: new CombinedError({
    networkError: r,
    response: t
  }),
  extensions: void 0,
  hasNext: !1,
  stale: !1
});

function makeFetchBody(e) {
  var r = {
    query: void 0,
    documentId: void 0,
    operationName: getOperationName(e.query),
    variables: e.variables || void 0,
    extensions: e.extensions
  };
  if ("documentId" in e.query && e.query.documentId && (!e.query.definitions || !e.query.definitions.length)) {
    r.documentId = e.query.documentId;
  } else if (!e.extensions || !e.extensions.persistedQuery || e.extensions.persistedQuery.miss) {
    r.query = stringifyDocument(e.query);
  }
  return r;
}

var makeFetchURL = (e, r) => {
  var t = "query" === e.kind && e.context.preferGetMethod;
  if (!t || !r) {
    return e.context.url;
  }
  var a = splitOutSearchParams(e.context.url);
  for (var o in r) {
    var n = r[o];
    if (n) {
      a[1].set(o, "object" == typeof n ? stringifyVariables(n) : n);
    }
  }
  var s = a.join("?");
  if (s.length > 2047 && "force" !== t) {
    e.context.preferGetMethod = !1;
    return e.context.url;
  }
  return s;
};

var splitOutSearchParams = e => {
  var r = e.indexOf("?");
  return r > -1 ? [ e.slice(0, r), new URLSearchParams(e.slice(r + 1)) ] : [ e, new URLSearchParams ];
};

var serializeBody = (e, r) => {
  if (r && !("query" === e.kind && !!e.context.preferGetMethod)) {
    var t = stringifyVariables(r);
    var a = (e => {
      var r = new Map;
      if (l !== NoopConstructor || c !== NoopConstructor) {
        i.clear();
        extract(r, "variables", e);
      }
      return r;
    })(r.variables);
    if (a.size) {
      var o = new FormData;
      o.append("operations", t);
      o.append("map", stringifyVariables({
        ...[ ...a.keys() ].map((e => [ e ]))
      }));
      var n = 0;
      for (var s of a.values()) {
        o.append("" + n++, s);
      }
      return o;
    }
    return t;
  }
};

var makeFetchOptions = (e, r) => {
  var t = {
    accept: "subscription" === e.kind ? "text/event-stream, multipart/mixed" : "application/graphql-response+json, application/graphql+json, application/json, text/event-stream, multipart/mixed"
  };
  var a = ("function" == typeof e.context.fetchOptions ? e.context.fetchOptions() : e.context.fetchOptions) || {};
  if (a.headers) {
    if ((e => "has" in e && !Object.keys(e).length)(a.headers)) {
      a.headers.forEach(((e, r) => {
        t[r] = e;
      }));
    } else if (Array.isArray(a.headers)) {
      a.headers.forEach(((e, r) => {
        if (Array.isArray(e)) {
          if (t[e[0]]) {
            t[e[0]] = `${t[e[0]]},${e[1]}`;
          } else {
            t[e[0]] = e[1];
          }
        } else {
          t[r] = e;
        }
      }));
    } else {
      for (var o in a.headers) {
        t[o.toLowerCase()] = a.headers[o];
      }
    }
  }
  var n = serializeBody(e, r);
  if ("string" == typeof n && !t["content-type"]) {
    t["content-type"] = "application/json";
  }
  return {
    ...a,
    method: n ? "POST" : "GET",
    body: n,
    headers: t
  };
};

var y = "undefined" != typeof TextDecoder ? new TextDecoder : null;

var h = /boundary="?([^=";]+)"?/i;

var m = /data: ?([^\n]+)/;

var toString = e => "Buffer" === e.constructor.name ? e.toString() : y.decode(e);

async function* streamBody(e) {
  if (e.body[Symbol.asyncIterator]) {
    for await (var r of e.body) {
      yield toString(r);
    }
  } else {
    var t = e.body.getReader();
    var a;
    try {
      while (!(a = await t.read()).done) {
        yield toString(a.value);
      }
    } finally {
      t.cancel();
    }
  }
}

async function* split(e, r) {
  var t = "";
  var a;
  for await (var o of e) {
    t += o;
    while ((a = t.indexOf(r)) > -1) {
      yield t.slice(0, a);
      t = t.slice(a + r.length);
    }
  }
}

async function* fetchOperation(e, r, t) {
  var a = !0;
  var o = null;
  var n;
  try {
    yield await Promise.resolve();
    var s = (n = await (e.context.fetch || fetch)(r, t)).headers.get("Content-Type") || "";
    var i;
    if (/multipart\/mixed/i.test(s)) {
      i = async function* parseMultipartMixed(e, r) {
        var t = e.match(h);
        var a = "--" + (t ? t[1] : "-");
        var o = !0;
        var n;
        for await (var s of split(streamBody(r), "\r\n" + a)) {
          if (o) {
            o = !1;
            var i = s.indexOf(a);
            if (i > -1) {
              s = s.slice(i + a.length);
            } else {
              continue;
            }
          }
          try {
            yield n = JSON.parse(s.slice(s.indexOf("\r\n\r\n") + 4));
          } catch (e) {
            if (!n) {
              throw e;
            }
          }
          if (n && !1 === n.hasNext) {
            break;
          }
        }
        if (n && !1 !== n.hasNext) {
          yield {
            hasNext: !1
          };
        }
      }(s, n);
    } else if (/text\/event-stream/i.test(s)) {
      i = async function* parseEventStream(e) {
        var r;
        for await (var t of split(streamBody(e), "\n\n")) {
          var a = t.match(m);
          if (a) {
            var o = a[1];
            try {
              yield r = JSON.parse(o);
            } catch (e) {
              if (!r) {
                throw e;
              }
            }
            if (r && !1 === r.hasNext) {
              break;
            }
          }
        }
        if (r && !1 !== r.hasNext) {
          yield {
            hasNext: !1
          };
        }
      }(n);
    } else if (!/text\//i.test(s)) {
      i = async function* parseJSON(e) {
        yield JSON.parse(await e.text());
      }(n);
    } else {
      i = async function* parseMaybeJSON(e) {
        var r = await e.text();
        try {
          var t = JSON.parse(r);
          if ("production" !== process.env.NODE_ENV) {
            console.warn('Found response with content-type "text/plain" but it had a valid "application/json" response.');
          }
          yield t;
        } catch (e) {
          throw new Error(r);
        }
      }(n);
    }
    var f;
    for await (var l of i) {
      if (l.pending && !o) {
        f = l.pending;
      } else if (l.pending) {
        f = [ ...f, ...l.pending ];
      }
      o = o ? mergeResultPatch(o, l, n, f) : makeResult(e, l, n);
      a = !1;
      yield o;
      a = !0;
    }
    if (!o) {
      yield o = makeResult(e, {}, n);
    }
  } catch (r) {
    if (!a) {
      throw r;
    }
    yield makeErrorResult(e, n && (n.status < 200 || n.status >= 300) && n.statusText ? new Error(n.statusText) : r, n);
  }
}

function makeFetchSource(e, r, t) {
  var a;
  if ("undefined" != typeof AbortController) {
    t.signal = (a = new AbortController).signal;
  }
  return o((() => {
    if (a) {
      a.abort();
    }
  }))(n((e => !!e))(s(fetchOperation(e, r, t))));
}

export { CombinedError as C, makeFetchBody as a, makeErrorResult as b, mergeResultPatch as c, makeFetchURL as d, makeFetchOptions as e, makeFetchSource as f, getOperationType as g, createRequest as h, stringifyVariables as i, keyDocument as k, makeResult as m, stringifyDocument as s };
//# sourceMappingURL=urql-core-chunk.mjs.map
