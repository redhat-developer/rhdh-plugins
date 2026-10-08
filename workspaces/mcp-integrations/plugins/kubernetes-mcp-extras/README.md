# kubernetes-mcp-extras

A backend plugin that registers MCP actions for Kubernetes with the Backstage
actions registry. It talks to the `kubernetes-backend` plugin over its HTTP API,
so the `@backstage/plugin-kubernetes-backend` plugin must also be installed and
configured in your backend.

The following actions are provided:

- `get-kubernetes-clusters` — lists all Kubernetes clusters registered with this
  Backstage instance.
- `get-kubernetes-resources-for-entity` — fetches the Kubernetes resources
  associated with a catalog entity across all registered clusters.

## Installation

This plugin is installed via the `@red-hat-developer-hub/backstage-plugin-kubernetes-mcp-extras` package. To install it to your backend package, run the following command:

```bash
# From your root directory
yarn --cwd packages/backend add @red-hat-developer-hub/backstage-plugin-kubernetes-mcp-extras
```

Then add the plugin to your backend in `packages/backend/src/index.ts`:

```ts
const backend = createBackend();
// ...
backend.add(
  import('@red-hat-developer-hub/backstage-plugin-kubernetes-mcp-extras'),
);
```

## Development

This plugin backend can be started in a standalone mode from directly in this
package with `yarn start`. It is a limited setup that is most convenient when
developing the plugin backend itself.

If you want to run the entire project, including the frontend, run `yarn start` from the root directory.
