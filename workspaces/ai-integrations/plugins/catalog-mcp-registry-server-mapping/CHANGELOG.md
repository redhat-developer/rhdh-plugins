# @red-hat-developer-hub/backstage-plugin-catalog-mcp-registry-server-mapping

## 0.4.0

### Minor Changes

- 4bb6232: Rename the mapping common library to `catalog-mcp-registry-server-mapping` (package, directory, and `pluginId`) to match workspace naming conventions. Consumers of `@red-hat-developer-hub/backstage-plugin-mcp-registry-server-mapping-common` should update to the new package name.

## 0.3.0

### Minor Changes

- 5fc4c61: Add MCP Registry annotation projection: recursive scalar-leaf walker that projects unmapped server.json attributes into `modelcontextprotocol.io/*` annotations with D3 key sanitization, D9 secret redaction, D11 URL gating, and D12 null/empty omission. Also add closed schema-aligned `McpServerDocument` typing, structural `assertServerJsonSchema` validation on mapping/projection entrypoints (including required `$schema` with `server.schema.json` basename), and an optional D8 `placeholderRemoteUrl` override (D11-checked before `websiteUrl` fallback).

## 0.2.0

### Minor Changes

- e760451: Add MCP Registry server mapping common library plugin: deterministic transform from MCP Registry server.json to Backstage mcp-server API entity with direct field mapping, D11 URL scheme policy, D4 identity derivation, D8 placeholder remotes, and SCM-aware repository URL combination.
