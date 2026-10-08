# Contributing to the Extensions frontend plugin

Local development for `@red-hat-developer-hub/backstage-plugin-extensions`. Operator install, RBAC, and NFS wiring stay in the [README](./README.md).

## Prerequisites

From `workspaces/extensions`:

```bash
yarn install
```

## Plugin `dev/` harness

From `plugins/extensions`, or via `yarn workspace @red-hat-developer-hub/backstage-plugin-extensions …`.

| Mode                      | Command             | Entry            |
| ------------------------- | ------------------- | ---------------- |
| New frontend system (NFS) | `yarn start`        | `dev/index.tsx`  |
| Legacy                    | `yarn start:legacy` | `dev/legacy.tsx` |

Both use mock Extensions API data and do **not** require a running backend. Use them for UI layout, routing, and catalog-browse components.

Curl against a live backend (`yarn start` / `yarn start:legacy` from the workspace, or the backend plugin harness) needs a contributor-supplied static token. See [extensions-backend/CONTRIBUTING.md](../extensions-backend/CONTRIBUTING.md).

## Tests, lint, typecheck

```bash
yarn workspace @red-hat-developer-hub/backstage-plugin-extensions test
yarn workspace @red-hat-developer-hub/backstage-plugin-extensions lint
yarn tsc
```

`src/plugin.test.ts` asserts plugin id, API factory registration (`plugin.extensions.api-ref`, `plugin.extensions.dynamic-plugins-info`), and route refs. Backend HTTP path/header contracts live in `extensions-common` (`ExtensionsBackendClient.test.ts`).

Use `CI=true` and `--watchAll=false` in non-interactive environments.

## When to use the full workspace

Stay on plugin `dev/` for frontend-only work and for **Backstage version-bump PRs** (scoped package tests are the bump gate).

Start the workspace when you need a live backend, catalog module entities, or install/configure against `extensions-backend`:

| Command (from `workspaces/extensions`) | What it starts       |
| -------------------------------------- | -------------------- |
| `yarn start`                           | NFS app + backend    |
| `yarn start:legacy`                    | Legacy app + backend |

`packages/backend` already wires the backend plugin and `@red-hat-developer-hub/backstage-plugin-catalog-backend-module-extensions`. Do not add a third full app.

Workspace Playwright (`yarn test:e2e:ci`) is catalog UI + i18n + axe. It is **not** required to merge bump-trust changes. It does not cover install/configure, RBAC denial, or live dynamic-plugin install (see [rhdh-plugin-export-overlays](https://github.com/redhat-developer/rhdh-plugin-export-overlays)).

See the [workspace contributor index](../../CONTRIBUTING.md) for all package commands.
