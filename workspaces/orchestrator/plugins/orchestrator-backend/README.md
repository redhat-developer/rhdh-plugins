# Orchestrator Backend Plugin for Backstage

Welcome to the backend package for the Orchestrator plugin!

For more information about the Orchestrator plugin, see the [Orchestrator Plugin documentation](https://github.com/redhat-developer/rhdh-plugins/tree/main/workspaces/orchestrator/plugins/orchestrator) on GitHub.

For local development and contributor workflows, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## MCP Actions

The Orchestrator backend plugin registers MCP (Model Context Protocol) actions that allow AI agents and MCP clients (e.g. Cursor, Claude Code) to discover Orchestrator workflows and instances, and to run workflows, programmatically.

### Available actions

| Action                | Description                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------ |
| `list-workflows`      | Lists the workflow definitions visible to the caller, optionally filtered by name and/or last-run status.    |
| `get-workflow-schema` | Returns a workflow's input JSON schema. Call this before `execute-workflow` to learn what inputs it expects. |
| `execute-workflow`    | Starts a new run of a workflow with the given inputs, validated against the workflow's own schema first.     |
| `list-instances`      | Lists workflow runs (instances) visible to the caller, optionally filtered by status.                        |
| `get-instance`        | Fetches a single workflow instance's status, timestamps, and output data.                                    |

These actions enforce the same Backstage permissions as the Orchestrator REST API (`orchestrator.workflow`, `orchestrator.workflow.use`, `orchestrator.instanceAdminView`) — no separate permission model is introduced for MCP.

### Enabling MCP Actions

To enable MCP actions, install the `@backstage/plugin-mcp-actions-backend` package and configure authentication:

1. Install the MCP actions backend plugin:

```bash
# From your root directory
yarn --cwd packages/backend add @backstage/plugin-mcp-actions-backend
```

2. Add the plugin to your backend in `packages/backend/src/index.ts`:

```ts
backend.add(import('@backstage/plugin-mcp-actions-backend'));
```

3. Add the orchestrator plugin as an action source and configure a static token for MCP client authentication in your `app-config.yaml`:

```yaml
backend:
  actions:
    pluginSources:
      - 'orchestrator'
  auth:
    externalAccess:
      - type: static
        options:
          token: ${MCP_TOKEN}
          subject: mcp-clients
```

4. Set the `MCP_TOKEN` environment variable (8 characters or longer) before starting the backend.

### Interacting with MCP Actions

See the [Backstage MCP Actions Backend documentation](https://github.com/backstage/backstage/tree/master/plugins/mcp-actions-backend#configuring-mcp-clients) for more information on configuring MCP clients.

Sample `mcp.json` for Cursor:

```json
{
  "mcpServers": {
    "backstage-actions": {
      "url": "http://localhost:7007/api/mcp-actions/v1",
      "headers": {
        "Authorization": "Bearer ${MCP_TOKEN}"
      }
    }
  }
}
```
