# Example `server.json` fixtures

Adapted from the MCP Registry
[generic server.json examples](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/generic-server-json.md).

Structure matches the upstream examples; names, versions, URLs, and metadata
values are rewritten for local testing of the mapping library.

| File                           | Upstream example                          |
| ------------------------------ | ----------------------------------------- |
| `npm.server.json`              | Basic server with NPM package             |
| `npm-oci.server.json`          | Filesystem server with npm + OCI packages |
| `nuget-positional.server.json` | Constant (fixed) package arguments        |
| `remote.server.json`           | Remote server                             |
