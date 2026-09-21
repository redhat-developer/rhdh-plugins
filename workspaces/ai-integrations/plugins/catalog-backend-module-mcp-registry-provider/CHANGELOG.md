# @red-hat-developer-hub/backstage-plugin-catalog-backend-module-mcp-registry-provider

## 0.2.1

### Patch Changes

- 0c71a1f: Align `@backstage/catalog-model` dependency version with the embedded workspace package.

## 0.2.0

### Minor Changes

- 4bb6232: Add MCP Registry provider backend module that ingests MCP servers from a configured registry into the catalog as mcp-server API entities. Supports cursor pagination with full-mutation semantics, per-entry failure isolation with last-good retention, nested config under `catalog.providers.mcpRegistry.mcpRegistry` (extra instance ids warn and are ignored), optional `defaultOwner` / `defaultLifecycle` / `remotesOnly` / `latestVersion` (`?version=latest`) / `hostAllowList` / `maxEntries` soft-stop with `pageLimit` resume (re-adding last-good as degraded on later syncs until the server is refreshed successfully), schedule and page controls, identity prefix override, redirect handling with Location validation, and clearer fetch error reporting.

### Patch Changes

- Updated dependencies [4bb6232]
  - @red-hat-developer-hub/backstage-plugin-catalog-mcp-registry-server-mapping@0.4.0
