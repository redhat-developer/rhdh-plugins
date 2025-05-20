# Development-only HTTP server

The purpose of this Express Node.js server is to respond with JSON Schema chunks and other test data to ease development of the active widgets, like the `SchemaUpdater`.

The production environment is expected to provide another HTTP server (unrelated to this testing one) which dynamically provides `SchemaUpdater` JSON-schema snippets or fetch/validation functionality for other widgets.

## How to run

```bash
yarn install
yarn start
```

## How to invoke - examples

### Hello world

```
curl localhost:12345
```

### HTTP GET with headers

```
curl -H "Accept: application/json" -H "foo: bar" localhost:12345/chunk01
```

### HTTP POST with headers and body

```
curl -H 'Content-Type: application/json' -H "Accept: application/json" -X POST -d '{"param1":"foo"}' -H "foo: bar" localhost:12345/chunk01
```

leads to:

```
request:  {
  originalUrl: '/chunk01',
  method: 'POST',
  headers: {
    host: 'localhost:12345',
    'user-agent': 'curl/8.9.1',
    'content-type': 'application/json',
    accept: 'application/json',
    foo: 'bar',
    'content-length': '16'
  },
  body: { param1: 'foo' }
}
```
