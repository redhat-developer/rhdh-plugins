# MCP Registry Provider

A Backstage catalog backend module that ingests MCP servers from a configured [MCP Registry](https://github.com/modelcontextprotocol/registry) into the RHDH catalog as `mcp-server` API entities.

## Installation

Install the package:

```bash
yarn add @red-hat-developer-hub/backstage-plugin-catalog-backend-module-mcp-registry-provider
```

Add the module to your backend:

```ts
// packages/backend/src/index.ts
backend.add(import('@backstage/plugin-catalog-backend-module-ai-model'));
backend.add(
  import(
    '@red-hat-developer-hub/backstage-plugin-catalog-backend-module-mcp-registry-provider'
  ),
);
```

Since [Backstage 1.51.0](https://github.com/backstage/backstage/releases/tag/v1.51.0), `spec.type: mcp-server` entities (they use `spec.remotes` and omit `spec.definition`) are accepted only when `@backstage/plugin-catalog-backend-module-ai-model` is installed. Without that module the catalog keeps the generic API validator, which rejects these entities and does not list them.

## Configuration

Configure the provider in your `app-config.yaml`:

```yaml
catalog:
  providers:
    mcpRegistry:
      # Reserved instance id — only this key is supported today.
      mcpRegistry:
        baseUrl: https://registry.example.com
        # Optional: override the mapping identity prefix (default: mcp.registry)
        # baseName: com.example.registry
        # Optional: registry API version slug (default: v1)
        # apiVersion: v1
        # Optional: default entity owner (default: unknown)
        # defaultOwner: group:default/mcp-admins
        # Optional: max pages fetched per sync (default: 10)
        # pageLimit: 10
        # Optional: registry page size sent as ?limit= (omitted by default)
        # pageSize: 50
        # Optional: max entries per complete traversal; soft-stops with end cursor (default: 5000)
        # maxEntries: 5000
        # Optional: ingest only servers with at least one native remote (default: false)
        # remotesOnly: false
        # Optional: restrict outbound requests to specific hostnames (defense-in-depth)
        # hostAllowList:
        #   - registry.example.com
        # Optional: sync schedule (defaults shown below)
        # schedule:
        #   frequency: { minutes: 30 }
        #   timeout: { minutes: 3 }
        #   # Optional: defer the first sync
        #   # initialDelay: { seconds: 15 }
```

### Configuration options

| Option          | Required | Default                          | Description                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------- | -------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`       | Yes      | —                                | MCP Registry base URL. Also passed to the mapping as `placeholderRemoteUrl` when a server has no valid remotes.                                                                                                                                                                                                                                                                                 |
| `baseName`      | No       | `mcp.registry` (mapping default) | Override the mapping identity prefix for `metadata.name`                                                                                                                                                                                                                                                                                                                                        |
| `apiVersion`    | No       | `v1`                             | Registry API version slug. The servers endpoint is `<baseUrl>/<apiVersion>/servers`. Note: the live MCP Registry may serve `/v0` or `/v0.1`; set `apiVersion` to match your registry.                                                                                                                                                                                                           |
| `defaultOwner`  | No       | `unknown` (mapping default)      | Backstage entity reference used as `spec.owner`                                                                                                                                                                                                                                                                                                                                                 |
| `pageLimit`     | No       | `10`                             | Maximum number of pages fetched per sync. When more pages remain, the provider saves the cursor and continues on the next sync (no mutation until the registry is fully traversed).                                                                                                                                                                                                             |
| `pageSize`      | No       | _(registry default)_             | Sent as `?limit=` on each list request. When omitted, the registry's default page size applies.                                                                                                                                                                                                                                                                                                 |
| `maxEntries`    | No       | `5000`                           | Maximum total server entries buffered for one complete registry traversal (spans resume syncs). When exceeded, the provider commits the buffer, saves an end cursor, and later traversals stop there until `maxEntries` is patched.                                                                                                                                                             |
| `remotesOnly`   | No       | `false`                          | When `true`, skip servers that do not declare at least one native remote (non-empty type and http(s) URL). Package-only and placeholder-remote servers are omitted from the catalog.                                                                                                                                                                                                            |
| `hostAllowList` | No       | _(none — all hosts allowed)_     | Array of permitted hostnames. When set, `baseUrl` hostname must be in this list and every outbound request (including each redirect `Location` and `response.url`) is validated at runtime. Missing `response.url` fails closed. Redirects are followed manually so disallowed hosts are never contacted. Provides defense-in-depth against SSRF. When omitted, a warning is logged at startup. |
| `schedule`      | No       | 30m frequency, 3m timeout        | `SchedulerServiceTaskScheduleDefinition` controlling sync cadence. The first sync runs after one `frequency` interval unless `initialDelay` is set.                                                                                                                                                                                                                                             |

### Multiple registries

`catalog.providers.mcpRegistry` is a map of instance ids so additional
registries can be added later. This implementation only reads the reserved
`mcpRegistry` instance (`catalog.providers.mcpRegistry.mcpRegistry`). Other
instance ids are ignored and a warning is logged that multiple MCP Registry
providers are not supported yet. Use `baseName` on the reserved instance to
override the identity prefix if needed for future multi-registry support.

## Behavior

### Pagination

The provider fully traverses the registry's cursor-based pagination, accumulating all server entries. Cursors are treated as opaque strings. The `pageLimit` configuration caps the number of pages fetched **per sync**. If the registry still has more pages after that cap, the provider saves the next cursor, buffers the entries fetched so far, and continues from that cursor on the next scheduled sync — it does **not** commit a mutation until a sync reaches the end of the registry (no `nextCursor`). When a traversal completes, the provider commits a full mutation and the following sync starts from the beginning again. The `maxEntries` configuration caps the total buffered servers for that complete traversal (not per individual sync tick). When the cap is hit, the provider commits the buffered entries, saves that stop point as an **end cursor**, and later full traversals end at that cursor instead of a missing `nextCursor`. Patching `maxEntries` clears the saved end cursor so traversal returns to normal.

### Mapping

Each server entry's `.server` object is transformed into an `mcp-server` API entity using the [`catalog-mcp-registry-server-mapping`](../catalog-mcp-registry-server-mapping) library. The provider passes `defaultOwner` and `baseName` as caller overrides, and always passes the configured `baseUrl` as `placeholderRemoteUrl` so a server with no valid remotes gets a placeholder remote for that registry before falling back to `websiteUrl`. When `remotesOnly` is `true`, servers without a native remote are skipped before mapping. It never reimplements the mapping rules.

### Full mutation

When a registry traversal completes (no remaining `nextCursor`, possibly after several resume syncs), the provider commits a **full mutation** — the catalog converges to the registry's current server set. Servers removed from the registry are automatically pruned. Partial resume ticks do not mutate.

### Error handling

- **Per-entry failures**: If a single server entry fails mapping, the provider logs the error and continues. If a last-good entity exists for that server (matched by `name` and `version`), it is retained with `redhat.com/rhdh-mcp-registry-sync-status: degraded`.
- **Registry-level failures**: Transport errors, non-2xx responses, unparseable JSON, or pagination safeguard trips abort the sync — no mutation is committed, preserving the prior catalog state.

### Annotations

Each entity carries:

- `backstage.io/managed-by-location`: `url:<normalizedBaseUrl>`
- `backstage.io/managed-by-origin-location`: `url:<normalizedBaseUrl>`
- `redhat.com/rhdh-mcp-registry-sync-status`: `ok` or `degraded`
- `modelcontextprotocol.io/name`: the server's canonical name
- `modelcontextprotocol.io/version`: the server's version

Example catalog entities matching this shape (generated from
[`examples/mcp-registry/seed-data/seed.json`](../../examples/mcp-registry/seed-data/seed.json))
are in [`examples/api-mcp-servers.yaml`](../../examples/api-mcp-servers.yaml).

## Non-Remote MCP Servers

MCP servers without a remote deployment (package(s) only or [custom installation](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/generic-server-json.md#server-with-custom-installation-path)) can be queried via: `GET /api/catalog/entities?filter=kind=API,spec.type=mcp-server,spec.remotes.type=undefined`

These MCP server entries have a single remote _placeholder_ field which should **not** be parsed by a client always expecting a remote MCP Server. To avoid ingesting them at all, set `remotesOnly: true` on the provider. To keep them in the catalog but filter them out at query time, use `POST /api/catalog/entities/by-query` with the following JSON body:

```json
{
  "query": {
    "$all": [
      { "kind": "API" },
      { "spec.type": "mcp-server" },
      { "$not": { "spec.remotes.type": "undefined" } }
    ]
  }
}
```

## Deploy MCP Registry Locally

To run a local MCP Registry for provider development, see
[Deploy MCP Registry Locally](../../docs/deploy-mcp-registry-locally.md).
