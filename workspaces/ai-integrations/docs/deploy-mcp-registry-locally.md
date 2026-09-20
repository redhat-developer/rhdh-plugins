# Deploy MCP Registry Locally

For local provider development against a real registry instance, this workspace
includes Node scripts under [`scripts/`](../scripts/) that start the upstream
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
yarn start-local-mcp-registry
```

You can also run the script directly from the workspace root:

```bash
node scripts/deploy-local-mcp-registry.ts
```

This clones the registry into `~/.cache/rhdh-ai-integrations/mcp-registry`
(if needed; override with `MCP_REGISTRY_REPO_DIR`) at tag `v1.8.1` by default
(override with `MCP_REGISTRY_REPO_URL` / `MCP_REGISTRY_REPO_REVISION`), starts
PostgreSQL and the registry in the background, **waits until the HTTP API
responds** (seed import can take a few minutes when seeding from the public
registry), and serves the API at
[http://localhost:8080](http://localhost:8080).

Start the registry **before** `yarn dev`. If the provider syncs while the
registry is still importing seed data, you will see
`Failed to reach MCP Registry ... TypeError: fetch failed` (no mutation). Restart
the backend after the registry is ready, or wait for the next scheduled sync.

Optional environment variables:

| Variable                        | Default                                                | Description                                                                                                                                                                                                 |
| ------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MCP_REGISTRY_REPO_DIR`         | `~/.cache/rhdh-ai-integrations/mcp-registry`           | Local checkout path for the registry                                                                                                                                                                        |
| `MCP_REGISTRY_REPO_URL`         | `https://github.com/modelcontextprotocol/registry.git` | Git remote cloned into `MCP_REGISTRY_REPO_DIR`                                                                                                                                                              |
| `MCP_REGISTRY_REPO_REVISION`    | `v1.8.1`                                               | Git branch or tag checked out for compose/config                                                                                                                                                            |
| `MCP_REGISTRY_IMAGE_NAME`       | `ghcr.io/modelcontextprotocol/registry`                | Registry container image name (without tag)                                                                                                                                                                 |
| `MCP_REGISTRY_IMAGE_TAG`        | `1.8.1`                                                | Registry container image tag                                                                                                                                                                                |
| `MCP_REGISTRY_DATA_DIR`         | _(checkout `./data`)_                                  | Host directory mounted at `/data` instead of the [default seed data](https://github.com/modelcontextprotocol/registry/blob/main/data/seed.json). When set, seeds from `data/seed.json` with validation off. |
| `MCP_REGISTRY_URL`              | `http://localhost:8080`                                | URL probed for readiness (and typically used as `catalog.providers.mcpRegistry.baseUrl`)                                                                                                                    |
| `MCP_REGISTRY_API_VERSION`      | `v0.1`                                                 | Registry HTTP API version path segment used for the readiness probe                                                                                                                                         |
| `MCP_REGISTRY_READY_TIMEOUT_MS` | `300000` (5m)                                          | How long `start-local-mcp-registry` waits for the API before failing                                                                                                                                        |

Example with custom seed content (directory must contain `seed.json`):

```bash
MCP_REGISTRY_DATA_DIR=./examples/mcp-registry/seed-data yarn start-local-mcp-registry
```

View logs (example with Podman):

```bash
podman compose -f ~/.cache/rhdh-ai-integrations/mcp-registry/docker-compose.yml logs -f
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
yarn stop-local-mcp-registry
```

Or from the workspace root:

```bash
node scripts/undeploy-local-mcp-registry.ts
```

This runs `compose down` for the same stack. The
`~/.cache/rhdh-ai-integrations/mcp-registry` checkout is left in place so the
next deploy is faster.
