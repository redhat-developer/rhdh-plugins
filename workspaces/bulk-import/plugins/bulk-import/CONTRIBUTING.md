# Contributing to bulk-import (frontend)

Developer guide for changing `@red-hat-developer-hub/backstage-plugin-bulk-import`. Operator install and configuration stay in [README.md](./README.md).

## Prerequisites

- Node.js matching the workspace `engines` field (see `workspaces/bulk-import/package.json`)
- Yarn install for `workspaces/bulk-import`
- Backend plugin available when exercising live listing APIs (standalone backend `dev/` or full workspace backend)

## Dev harness

New Frontend System (default):

```console
yarn workspace @red-hat-developer-hub/backstage-plugin-bulk-import start
```

Legacy frontend entry:

```console
yarn workspace @red-hat-developer-hub/backstage-plugin-bulk-import start:legacy
```

Harness code lives under [`dev/`](./dev/) (`index.tsx`, `legacy.tsx`, mocks). Prefer this for UI smoke during Backstage bumps unless you need full-app OAuth.

## Scoped validation commands

From `workspaces/bulk-import`:

```bash
yarn workspace @red-hat-developer-hub/backstage-plugin-bulk-import test
yarn workspace @red-hat-developer-hub/backstage-plugin-bulk-import lint:check
yarn workspace @red-hat-developer-hub/backstage-plugin-bulk-import-common test
yarn tsc
yarn lint
```

Bump-critical frontend coverage focuses on plugin API wiring (`bulkImportApiRef`) and query/token gating (`useRepositories` with a real React Query client)—not deep table/pagination matrices.

## When to use the full workspace / Playwright / overlays

| Need                                                 | Use                                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------------------- |
| Component/hook unit tests, API client, plugin wiring | Scoped `yarn workspace … test` + plugin `dev/`                            |
| Full app navigation with real auth providers         | Workspace `yarn start` or `yarn start:legacy`                             |
| Automated UI e2e in this workspace                   | `yarn test:e2e:legacy` / `yarn test:e2e:nfs` / `yarn test:e2e:all`        |
| Real multi-user OAuth on-behalf-of flows             | Overlays or consumer RHDH — **not** an epic deliverable for CI bump trust |

**Important:** Workspace Playwright intentionally **mocks OAuth**. Passing e2e here does **not** prove live SCM token flows. Treat overlays / consumer deployments as the place for credential-backed multi-user coverage.

**Evaluation (RHIDP-14104):** Existing `packages/app` (NFS) and `packages/app-legacy` are justified for OAuth and cross-plugin integration. Bump-trust default remains plugin `dev/` + scoped CI. Do not add another `packages/app`.

## Related packages

- Backend contributor guide: [`../bulk-import-backend/CONTRIBUTING.md`](../bulk-import-backend/CONTRIBUTING.md)
- Shared permissions: `@red-hat-developer-hub/backstage-plugin-bulk-import-common` (`yarn workspace …-bulk-import-common test`)
