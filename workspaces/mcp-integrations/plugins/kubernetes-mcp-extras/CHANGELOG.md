# @red-hat-developer-hub/backstage-plugin-kubernetes-mcp-extras

## 0.2.0

### Minor Changes

- 8c23687: Add a new `kubernetes-mcp-extras` backend plugin with two MCP actions ported from backstage/backstage#33832: `get-kubernetes-clusters` and `get-kubernetes-resources-for-entity`. The actions call the `kubernetes-backend` plugin over its HTTP API on behalf of the caller.
