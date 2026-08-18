# x2a backend

Backstage backend for local development of the **x2a** workspace.

This package wires together the x2a plugins and the standard Backstage
infrastructure so you can run a fully functional backend on your machine.

## x2a service factories

The x2a plugins share service refs defined in
`@red-hat-developer-hub/backstage-plugin-x2a-node` (the `x2a-node`
node-library). Those refs carry **no `defaultFactory`**.

The `x2a-backend` default export is a `createBackendFeatureLoader` that yields
both the plugin and the matching service factories (`x2aDatabaseServiceFactory`,
`kubeServiceFactory`). This means a single `backend.add(...)` call registers
everything:

```ts
backend.add(import('@red-hat-developer-hub/backstage-plugin-x2a-backend'));
```

This design works in both local development and in RHDH dynamic plugin mode,
because RHDH's dynamic plugin loader only reads the default export of each
plugin package.

## Development

From the workspace root:

```bash
yarn install
yarn start
```

Override secrets or local configuration in `app-config.local.yaml`.
The backend starts on port **7007** by default.

## Populating the catalog

Add location entries under `catalog.locations` in `app-config.yaml`.
See [Adding Components to the Catalog](https://backstage.io/docs/features/software-catalog/#adding-components-to-the-catalog)
for details.

## Documentation

- [Backstage Documentation](https://backstage.io/docs)
