# Example `server.json` fixtures

Adapted from the MCP Registry **v1.8.1**
[generic server.json examples](https://github.com/modelcontextprotocol/registry/blob/v1.8.1/docs/reference/server-json/generic-server-json.md),
which conform to the
[`server.schema.json`](https://github.com/modelcontextprotocol/registry/blob/v1.8.1/docs/reference/server-json/draft/server.schema.json)
draft at that tag.

Structure matches the upstream examples; names, versions, URLs, and metadata
values are rewritten for local testing of the mapping library.

| File                           | Upstream example                          |
| ------------------------------ | ----------------------------------------- |
| `npm.server.json`              | Basic server with NPM package             |
| `npm-oci.server.json`          | Filesystem server with npm + OCI packages |
| `nuget-positional.server.json` | Constant (fixed) package arguments        |
| `remote.server.json`           | Remote server                             |
