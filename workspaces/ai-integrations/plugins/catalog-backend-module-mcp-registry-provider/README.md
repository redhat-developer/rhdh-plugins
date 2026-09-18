# MCP Registry Provider

A Backstage catalog backend module that ingests MCP servers from a configured [MCP Registry](https://github.com/modelcontextprotocol/registry) into the RHDH catalog as `mcp-server` API entities.

## Installation

Add the module to your backend:

```ts
// packages/backend/src/index.ts
backend.add(
  import(
    '@red-hat-developer-hub/backstage-plugin-catalog-backend-module-mcp-registry-provider'
  ),
);
```

## Configuration

Configure the provider in your `app-config.yaml`:

```yaml
catalog:
  providers:
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
      # Optional: sync schedule (defaults shown below)
      # schedule:
      #   frequency: { minutes: 30 }
      #   timeout: { minutes: 3 }
      #   # Optional: defer the first sync
      #   # initialDelay: { seconds: 15 }
```

### Configuration options

| Option         | Required | Default                          | Description                                                                                                                                                                           |
| -------------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `baseUrl`      | Yes      | —                                | MCP Registry base URL                                                                                                                                                                 |
| `baseName`     | No       | `mcp.registry` (mapping default) | Override the mapping identity prefix for `metadata.name`                                                                                                                              |
| `apiVersion`   | No       | `v1`                             | Registry API version slug. The servers endpoint is `<baseUrl>/<apiVersion>/servers`. Note: the live MCP Registry may serve `/v0` or `/v0.1`; set `apiVersion` to match your registry. |
| `defaultOwner` | No       | `unknown` (mapping default)      | Backstage entity reference used as `spec.owner`                                                                                                                                       |
| `pageLimit`    | No       | `10`                             | Maximum number of pages fetched per sync. The provider fails the sync if the registry has more pages than this limit (to prevent incomplete catalog state).                           |
| `pageSize`     | No       | _(registry default)_             | Sent as `?limit=` on each list request. When omitted, the registry's default page size applies.                                                                                       |
| `schedule`     | No       | 30m frequency, 3m timeout        | `SchedulerServiceTaskScheduleDefinition` controlling sync cadence. The first sync runs after one `frequency` interval unless `initialDelay` is set.                                   |

### Multiple registries

Multiple registries are **not supported** in this implementation. Configuring a keyed map of instances (e.g., `mcpRegistry.internal` and `mcpRegistry.public`) will fail at startup with an actionable error. Use `baseName` to override the identity prefix if needed for future multi-registry support.

## Behavior

### Pagination

The provider fully traverses the registry's cursor-based pagination, accumulating all server entries. Cursors are treated as opaque strings. The `pageLimit` configuration caps the number of pages fetched per sync — if the registry still has more pages after reaching the limit, the sync fails without committing a mutation, preserving the prior catalog state.

### Mapping

Each server entry's `.server` object is transformed into an `mcp-server` API entity using the [`mcp-registry-server-mapping-common`](../mcp-registry-server-mapping-common) library. The provider passes `defaultOwner` and `baseName` as caller overrides but never reimplements the mapping rules.

### Full mutation

On each successful sync, the provider commits a **full mutation** — the catalog converges to the registry's current server set. Servers removed from the registry are automatically pruned.

### Error handling

- **Per-entry failures**: If a single server entry fails mapping, the provider logs the error and continues. If a last-good entity exists for that server (matched by `name` and `version`), it is retained with `redhat.com/rhdh-mcp-registry-sync-status: degraded`.
- **Registry-level failures**: Transport errors, non-2xx responses, unparseable JSON, or pagination safeguard trips abort the sync — no mutation is committed, preserving the prior catalog state.

### Annotations

Each entity carries:

- `backstage.io/managed-by-location`: `url:<normalizedBaseUrl>`
- `redhat.com/rhdh-mcp-registry-sync-status`: `ok` or `degraded`
- `modelcontextprotocol.io/name`: the server's canonical name
- `modelcontextprotocol.io/version`: the server's version
