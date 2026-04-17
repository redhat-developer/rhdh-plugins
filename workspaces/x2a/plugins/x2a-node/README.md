# x2a-node

Shared backend API surface for x2a plugins - a Backstage **node-library**.

This package holds the TypeScript interfaces, service ref declarations, utility
functions, and shared types that are consumed by multiple x2a backend plugins
(`x2a-backend`, `x2a-mcp-extras`, and potentially others).

## Why a separate package?

When RHDH exports a dynamic plugin, every workspace dependency that carries
`@backstage/*` packages must be **embedded** so those shared packages are moved
to `peerDependencies`. A direct dependency on the full `x2a-backend` would
pull in heavy transitive dependencies (`knex`, `@kubernetes/client-node`,
`express`, …).

`x2a-node` extracts the minimal API surface so consumer plugins like
`x2a-mcp-extras` can depend on a lightweight library instead of the full
backend implementation.

## Service refs and factories

This package owns the **canonical** service ref objects (`x2aDatabaseServiceRef`,
`kubeServiceRef`). All x2a plugins (including `x2a-backend` itself) import
and use these refs. This is required because Backstage resolves service
dependencies by **object identity**, not by string ID.

The refs carry no `defaultFactory`. The matching factories
(`x2aDatabaseServiceFactory`, `kubeServiceFactory`) are exported by
`x2a-backend` and bundled into its default export via
`createBackendFeatureLoader`. A single `backend.add(...)` call registers the
plugin together with both factories:

```ts
backend.add(import('@red-hat-developer-hub/backstage-plugin-x2a-backend'));
```

This design works in both local development and in RHDH dynamic plugin mode
(where the loader only reads the default export of each plugin package).

A Jest test in `x2a-backend` (`services/serviceRefSync.test.ts`) verifies that
`x2a-backend` re-exports the exact same ref objects from this package.
