# Deploy MCP Registry Locally

For local provider development against a real registry instance, this workspace
includes Node scripts under [`hack/`](../hack/) that start the upstream
[MCP Registry](https://github.com/modelcontextprotocol/registry) with Podman or
Docker Compose. They use the published
`ghcr.io/modelcontextprotocol/registry` image instead of upstream
`make dev-compose` (which builds with `ko` and does not work with Podman).

## Prerequisites

- Node.js 22+ (type stripping for `.ts` scripts)
- `git`
- `podman compose` or `docker compose`

## Start

From the `ai-integrations` workspace root, or from
`plugins/catalog-backend-module-mcp-registry-provider`:

```bash
yarn start-mcp-registry
```

You can also run the script directly from the workspace root:

```bash
node hack/deploy-mcp-registry.ts
```

This clones the registry into `/tmp/mcp-registry` (if needed), starts PostgreSQL
and the registry in the background, and serves the API at
[http://localhost:8080](http://localhost:8080).

Optional environment variables:

| Variable                | Default                                      | Description                                                                                                                                                                                                 |
| ----------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `REPO_DIR`              | `/tmp/mcp-registry`                          | Local checkout path for the registry                                                                                                                                                                        |
| `MCP_REGISTRY_IMAGE`    | `ghcr.io/modelcontextprotocol/registry:main` | Registry container image                                                                                                                                                                                    |
| `MCP_REGISTRY_DATA_DIR` | _(checkout `./data`)_                        | Host directory mounted at `/data` instead of the [default seed data](https://github.com/modelcontextprotocol/registry/blob/main/data/seed.json). When set, seeds from `data/seed.json` with validation off. |

Example with custom seed content (directory must contain `seed.json`):

```bash
MCP_REGISTRY_DATA_DIR=./examples/mcp-registry/seed-data yarn start-mcp-registry
```

View logs (example with Podman):

```bash
podman compose -f /tmp/mcp-registry/docker-compose.yml logs -f
```

## Point the provider at localhost

Configure `catalog.providers.mcpRegistry` to use the local registry. The default
local API version is `v0.1`:

```yaml
catalog:
  providers:
    mcpRegistry:
      baseUrl: http://localhost:8080
      apiVersion: v0.1
      # Optional when restricting outbound hosts:
      # hostAllowList:
      #   - localhost
```

Then start the workspace as usual (`yarn dev` from `workspaces/ai-integrations`).

See also the
[MCP Registry Provider](../plugins/catalog-backend-module-mcp-registry-provider/)
plugin for full configuration options.

## Stop

From the workspace root or
`plugins/catalog-backend-module-mcp-registry-provider`:

```bash
yarn stop-mcp-registry
```

Or from the workspace root:

```bash
node hack/undeploy-mcp-registry.ts
```

This runs `compose down` for the same stack. The `/tmp/mcp-registry` checkout is
left in place so the next deploy is faster.
