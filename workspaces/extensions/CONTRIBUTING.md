# Contributing in `workspaces/extensions`

Repository-wide process (forks, changesets, API reports) is in the [rhdh-plugins CONTRIBUTING guide](../../../CONTRIBUTING.md). This file is the workspace index for plugin `dev/` harnesses and scoped commands.

Operator install stays in each package README. Harness runbooks live next to the packages:

- [extensions-backend/CONTRIBUTING.md](./plugins/extensions-backend/CONTRIBUTING.md)
- [extensions/CONTRIBUTING.md](./plugins/extensions/CONTRIBUTING.md)

## Package commands

Run from `workspaces/extensions` after `yarn install`.

| Package                                                                     | Test                                                                                            | Lint                                                                                            | Start                                                                                               |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `@red-hat-developer-hub/backstage-plugin-extensions-backend`                | `yarn workspace @red-hat-developer-hub/backstage-plugin-extensions-backend test`                | `yarn workspace @red-hat-developer-hub/backstage-plugin-extensions-backend lint`                | `yarn workspace @red-hat-developer-hub/backstage-plugin-extensions-backend start`                   |
| `@red-hat-developer-hub/backstage-plugin-extensions-common`                 | `yarn workspace @red-hat-developer-hub/backstage-plugin-extensions-common test`                 | `yarn workspace @red-hat-developer-hub/backstage-plugin-extensions-common lint`                 | n/a (library)                                                                                       |
| `@red-hat-developer-hub/backstage-plugin-extensions`                        | `yarn workspace @red-hat-developer-hub/backstage-plugin-extensions test`                        | `yarn workspace @red-hat-developer-hub/backstage-plugin-extensions lint`                        | `yarn workspace @red-hat-developer-hub/backstage-plugin-extensions start` (NFS) or `… start:legacy` |
| `@red-hat-developer-hub/backstage-plugin-catalog-backend-module-extensions` | `yarn workspace @red-hat-developer-hub/backstage-plugin-catalog-backend-module-extensions test` | `yarn workspace @red-hat-developer-hub/backstage-plugin-catalog-backend-module-extensions lint` | n/a for bump-trust default                                                                          |

Workspace typecheck: `yarn tsc`.

Backend `dev/` curl smoke needs `BACKSTAGE_DEV_STATIC_TOKEN` (see [extensions-backend/CONTRIBUTING.md](./plugins/extensions-backend/CONTRIBUTING.md)). For the full workspace app, put the same `backend.auth.externalAccess` static token in gitignored `app-config.local.yaml`.

## Full workspace vs plugin `dev/` (evaluation)

| Situation                                                                             | Use                                                                                                                                     |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Backstage version-bump PR / plugin init / permission rules / backend client contracts | Plugin `dev/` + scoped `yarn workspace … test`. **Default.**                                                                            |
| Install APIs and catalog module together, or RBAC with real catalog entities          | `yarn start` (NFS) or `yarn start:legacy` — existing apps only. **No third full app.**                                                  |
| Catalog UI i18n / a11y                                                                | `yarn test:e2e:ci` (legacy + NFS Playwright). **Not** a bump-trust merge gate.                                                          |
| Live dynamic-plugin install, install+RBAC denial                                      | [rhdh-plugin-export-overlays](https://github.com/redhat-developer/rhdh-plugin-export-overlays) or a consumer RHDH — not this workspace. |

Legacy and NFS example apps already exist (`packages/app-legacy`, `packages/app`). Keep both. Do not scaffold another application for CI.
