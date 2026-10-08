# Contributing to bulk-import-backend

Developer guide for changing `@red-hat-developer-hub/backstage-plugin-bulk-import-backend`. Operator install and configuration stay in [README.md](./README.md).

## Prerequisites

- Node.js matching the workspace `engines` field (see `workspaces/bulk-import/package.json`)
- Yarn (workspace install from `workspaces/bulk-import` or monorepo root as documented for this repo)
- Local app-config for the `dev/` harness (workspace `app-config.yaml` / local overrides). Do not commit secrets; use placeholders and your own `*.local.yaml` (gitignored).

## Dev harness

Start the standalone backend plugin:

```console
yarn workspace @red-hat-developer-hub/backstage-plugin-bulk-import-backend start
```

The server is available at `http://localhost:7007/api/bulk-import` (default). This is the **default** smoke path for Backstage dependency bumps and day-to-day backend work.

Permission framework note: ensure your local config enables permissions consistently with how you intend to test authorize paths (see existing note in historical setup docs / host app config).

### Curl smoke checklist (placeholders only)

```bash
# Unauthenticated policy — expect 200
curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:7007/api/bulk-import/ping

# Requires permission allow for the caller; lists configured SCM hosts
curl -sS http://localhost:7007/api/bulk-import/scm-hosts

# Missing X-SCM-Tokens — expect 401
curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:7007/api/bulk-import/repositories

# With placeholder user token map — expect 200 when integrations + permissions allow
curl -sS \
  -H 'X-SCM-Tokens: {"https://github.com":"<PLACEHOLDER_USER_TOKEN>"}' \
  http://localhost:7007/api/bulk-import/repositories
```

Never paste real PATs or OAuth tokens into docs, tests, or commits.

## Scoped validation commands

From `workspaces/bulk-import`:

```bash
yarn workspace @red-hat-developer-hub/backstage-plugin-bulk-import-backend test
yarn workspace @red-hat-developer-hub/backstage-plugin-bulk-import-backend lint:check
yarn workspace @red-hat-developer-hub/backstage-plugin-bulk-import-common test
yarn tsc
yarn lint
```

Bump-trust coverage lives in package unit/integration tests (`startTestBackend`, router contracts, auditor token redaction, common permission contracts)—not in workspace Playwright.

## OpenAPI / api-docs

Source of truth: [`src/schema/openapi.yaml`](src/schema/openapi.yaml).

After changing the OpenAPI spec (or regenerating types/docs), run:

```console
yarn workspace @red-hat-developer-hub/backstage-plugin-bulk-import-backend run openapi
```

Then implement or update handlers in [`src/service/router.ts`](src/service/router.ts). **Skip** OpenAPI regen when only tests or docs change.

## When to use the full workspace app

| Need                                                          | Use                                                                                                                            |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Plugin init, router, migrations, permission/auditor contracts | Plugin `dev/` + scoped `yarn workspace … test`                                                                                 |
| Cross-plugin OAuth UI or full NFS/legacy app wiring           | Workspace `yarn start` / `yarn start:legacy`                                                                                   |
| Playwright (legacy + NFS)                                     | `yarn test:e2e:all` — **mocks OAuth**; not bump coverage for real on-behalf-of flows                                           |
| Real multi-user / credential-backed OAuth e2e                 | [`rhdh-plugin-export-overlays`](https://github.com/redhat-developer/rhdh-plugin-export-overlays) or a consumer RHDH deployment |

**Evaluation (RHIDP-14104):** `packages/app`, `packages/app-legacy`, and `packages/backend` already exist for OAuth/cross-plugin work. Do **not** scaffold another full app for bump trust. Default confidence comes from plugin harnesses + CI package tests.

## API docs

See [api-docs/README.md](./api-docs/README.md) for generated endpoint documentation.
