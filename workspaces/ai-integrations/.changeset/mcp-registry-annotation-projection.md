---
'@red-hat-developer-hub/backstage-plugin-mcp-registry-server-mapping-common': minor
---

Add MCP Registry annotation projection: recursive scalar-leaf walker that projects unmapped server.json attributes into `modelcontextprotocol.io/*` annotations with D3 key sanitization, D9 secret redaction, D11 URL gating, and D12 null/empty omission. Also add closed schema-aligned `McpServerDocument` typing, structural `assertServerJsonSchema` validation on mapping/projection entrypoints (including required `$schema` with `server.schema.json` basename), and an optional D8 `placeholderRemoteUrl` override (D11-checked before `websiteUrl` fallback).
