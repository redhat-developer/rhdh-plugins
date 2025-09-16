# mcp-integrations

This workspace contains plugins that define MCP actions that interact with the Backstage instance

To start the instance in dev mode:

1. Set `MCP_TOKEN` to some value (8 characters or longer)

2. Run `yarn install`

3. Run `yarn dev` to launch the frontend and backend

## Configuring Remote RHDH Instances

If you are deploying these plugins on a remote instance of RHDH, you'll need to make the following changes to your app-config (the local dev environment app-config already has these set):

1. Add the MCP Tool as a plugin source for the action registry

```yaml
backend:
  actions:
    pluginSources:
      - 'software-catalog-mcp-tool'
```

2. Specify a static token for authentication against the MCP server

```yaml
backend:
  auth:
    externalAccess:
      - type: static
        options:
          token: ${MCP_TOKEN}
          subject: mcp-clients
```

## Interacting with the MCP Tool(s)

See https://github.com/backstage/backstage/tree/master/plugins/mcp-actions-backend#configuring-mcp-clients for more information.

Sample mcp.json for Cursor:

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
