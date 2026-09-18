# @red-hat-developer-hub/backstage-plugin-mcp-registry-server-mapping-common

Deterministic transform from [MCP Registry](https://github.com/modelcontextprotocol/registry)
**v1.8.1**
[`server.json`](https://raw.githubusercontent.com/modelcontextprotocol/registry/v1.8.1/docs/reference/server-json/draft/server.schema.json)
documents to Backstage `API` entities with `spec.type: mcp-server`.

This common library is a pure mapping contract (no I/O, no registry client).
It is intended for consumers such as a future `mcp-registry-provider` catalog
entity provider.

## Install

```bash
yarn add @red-hat-developer-hub/backstage-plugin-mcp-registry-server-mapping-common
```

## Usage

### Map MCP `server.json` → Backstage `McpServerApiEntity` entity

```ts
import {
  mapServerToEntity,
  projectAnnotations,
} from '@red-hat-developer-hub/backstage-plugin-mcp-registry-server-mapping-common';
import type { McpServerDocument } from '@red-hat-developer-hub/backstage-plugin-mcp-registry-server-mapping-common';

const doc: McpServerDocument = {
  $schema:
    'https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json',
  name: 'io.github.example/weather',
  description: 'Weather MCP server',
  version: '1.0.0',
  remotes: [{ type: 'streamable-http', url: 'https://example.com/mcp' }],
};

const { entity, consumedPaths, reservedAnnotationKeys } = mapServerToEntity(
  doc,
  {
    owner: 'group:default/platform',
    lifecycle: 'production',
    // Optional D8 placeholder when no valid remotes remain (tried before websiteUrl)
    // placeholderRemoteUrl: 'https://example.com/placeholder',
  },
);

const projected = projectAnnotations(
  doc,
  consumedPaths,
  reservedAnnotationKeys,
);

entity.metadata.annotations = {
  ...entity.metadata.annotations,
  ...projected,
};
```

`mapServerToEntity` performs direct field mapping (identity, remotes, links,
dedicated annotations) and returns hand-off data for projection.
`projectAnnotations` emits remaining scalars as `modelcontextprotocol.io/*`
annotations without overwriting reserved keys.

### Input requirements

Documents must be structurally valid `McpServerDocument` values:

- `$schema` is required and must be an absolute URL whose basename is
  `server.schema.json`
- `name`, `description`, and `version` are required
- Only ServerDetail fields from the draft schema are allowed (closed shape)
- Nested transports, packages, icons, and inputs are type-checked at runtime

Invalid input throws `TypeError` (or `Error` for missing required mapping
fields) with an actionable message.

## `server.json` types

Field-level breakdowns of the MCP Registry **v1.8.1** `server.json` TypeScript
shapes live in [`docs/server-json-types.md`](./docs/server-json-types.md)
(source of truth: [`src/types.ts`](./src/types.ts)).

### Caller defaults (`McpServerMappingDefaults`)

| Field                  | Default        | Purpose                                         |
| ---------------------- | -------------- | ----------------------------------------------- |
| `prefix`               | `mcp.registry` | Prefix for derived `metadata.name`              |
| `owner`                | `unknown`      | `spec.owner`                                    |
| `lifecycle`            | `production`   | `spec.lifecycle`                                |
| `placeholderRemoteUrl` | _(none)_       | D8 placeholder URL before `websiteUrl` fallback |

## Mapping behavior (summary)

- **Identity** — `metadata.name` from sanitized `name` + `version` (+ optional prefix); `modelcontextprotocol.io/name` and `modelcontextprotocol.io/version` reserved
- **Remotes (D8/D11)** — copy `http`/`https` remotes with non-empty `type`; otherwise synthesize `{ type: "undefined", url }` from `placeholderRemoteUrl` then `websiteUrl`
- **URLs (D11)** — only absolute `http`/`https` are emitted on links, remotes, and projected URL annotations
- **Repository (D10)** — SCM-aware Source Code link + `backstage.io/source-location`; original URL on `modelcontextprotocol.io/repository.url`
- **Projection** — unmapped scalars under `modelcontextprotocol.io/<path>` with key sanitization, collision hashing, D9 secret redaction, and D12 null/empty omission

Design decisions and scenarios live under
[`openspec/changes/mcp-registry-server-mapping/`](../../openspec/changes/mcp-registry-server-mapping/).

## Examples

See [`examples/server-json/`](./examples/server-json/) for rewritten MCP Registry
`server.json` fixtures useful for local testing.

## Development

From the `workspaces/ai-integrations` workspace root:

```bash
# Type-check
yarn tsc

# Unit tests for this package
yarn test -- plugins/mcp-registry-server-mapping-common/src

# Lint / API report (when public exports change)
yarn lint:all
yarn build:api-reports:only
```
