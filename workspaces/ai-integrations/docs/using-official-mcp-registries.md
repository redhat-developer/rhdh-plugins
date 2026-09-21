# Using Official MCP Registries

The [official MCP Registry](https://github.com/modelcontextprotocol/registry) can be used by the [MCP Registry Provider](../plugins/catalog-backend-module-mcp-registry-provider/)
to ingest published MCP servers into the RHDH catalog as `mcp-server` API
entities.

The official registry API is documented in the upstream
[Official MCP Registry API](https://github.com/modelcontextprotocol/registry/blob/v1.8.1/docs/reference/api/official-registry-api.md)
(based on the
[generic registry API](https://github.com/modelcontextprotocol/registry/blob/v1.8.1/docs/reference/api/generic-registry-api.md)).
Interactive docs and the OpenAPI spec are available at
[registry.modelcontextprotocol.io/docs](https://registry.modelcontextprotocol.io/docs).

## Base URLs

| Environment | Base URL                                           |
| ----------- | -------------------------------------------------- |
| Production  | `https://registry.modelcontextprotocol.io`         |
| Staging     | `https://staging.registry.modelcontextprotocol.io` |

Listing servers does **not** require authentication. Auth endpoints on the
official registry are only needed for publishing and status updates, which this
provider does not perform.

## Configure the provider

Install and register the provider as described in the
[MCP Registry Provider README](../plugins/catalog-backend-module-mcp-registry-provider/README.md),
then set `catalog.providers.mcpRegistry.mcpRegistry` in `app-config.yaml`.
Set `baseUrl` to the production or staging URL from the [table above](#base-urls),
depending on which environment you intend to use.

The official registry serves the **`v0.1`** API instead of the `v1` default,
set `apiVersion: v0.1` explicitly.

**Production**

```yaml
catalog:
  providers:
    mcpRegistry:
      mcpRegistry:
        baseUrl: https://registry.modelcontextprotocol.io
        apiVersion: v0.1
        # Recommended: restrict outbound hosts (defense-in-depth against SSRF)
        hostAllowList:
          - registry.modelcontextprotocol.io
        # Optional: ingest only the latest version of each server
        # latestVersion: true
        # Optional: skip package-only / placeholder-remote servers
        # remotesOnly: true
```

**Staging**

```yaml
catalog:
  providers:
    mcpRegistry:
      mcpRegistry:
        baseUrl: https://staging.registry.modelcontextprotocol.io
        apiVersion: v0.1
        hostAllowList:
          - staging.registry.modelcontextprotocol.io
```

Then start the workspace (`yarn dev` from `workspaces/ai-integrations`) or your
Backstage backend. The provider syncs on its schedule (default: every 30
minutes). See the
[provider configuration options](../plugins/catalog-backend-module-mcp-registry-provider/README.md#configuration-options)
for `pageLimit`, `pageSize`, `maxEntries`, `schedule`, and related settings.

**Note**: The [Production](https://registry.modelcontextprotocol.io) environment has
_over 5000 entries_ so it is recommended to review [provider configuration options](../plugins/catalog-backend-module-mcp-registry-provider/README.md#configuration-options) to
configure a setup that respects rate limiting and that works for you.

## How the provider uses the official API

The provider calls the cursor-paginated list endpoint:

`GET <baseUrl>/<apiVersion>/servers`

Against the official registry that is
`GET https://registry.modelcontextprotocol.io/v0.1/servers` (plus optional query
parameters the provider supports).

| Official registry feature                 | Provider support                                    |
| ----------------------------------------- | --------------------------------------------------- |
| Cursor pagination (`?cursor=`, `?limit=`) | Yes — via `pageSize` / internal resume              |
| `?version=latest`                         | Yes — set `latestVersion: true`                     |
| `?search=`                                | Not used by the provider                            |
| `?updated_since=` (incremental sync)      | Not used — the provider does full traversals        |
| `?include_deleted=`                       | Not used (default listing excludes deleted servers) |
| Server detail / version history endpoints | Not used — entities are built from list entries     |
| Publish / auth / status PATCH endpoints   | Not used                                            |

For large registries, raise `pageLimit` / `maxEntries` or rely on resume syncs
as described in the
[provider pagination behavior](../plugins/catalog-backend-module-mcp-registry-provider/README.md#pagination).

## Local development alternative

To develop against a local registry instance instead of the public official
API, see
[Deploy MCP Registry Locally](./deploy-mcp-registry-locally.md).
