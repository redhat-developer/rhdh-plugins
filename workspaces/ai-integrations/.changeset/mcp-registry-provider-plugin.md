---
'@red-hat-developer-hub/backstage-plugin-catalog-backend-module-mcp-registry-provider': minor
---

Add MCP Registry provider backend module that ingests MCP servers from a configured registry into the catalog as mcp-server API entities. Supports cursor pagination with full-mutation semantics, per-entry failure isolation with last-good retention, nested config under `catalog.providers.mcpRegistry.mcpRegistry` (extra instance ids warn and are ignored), optional `remotesOnly`, `hostAllowList`, and `maxEntries` soft-stop with `pageLimit` resume, schedule and page controls, identity prefix override, redirect handling with Location validation, and clearer fetch error reporting.
