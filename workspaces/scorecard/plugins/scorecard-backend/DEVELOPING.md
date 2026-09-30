# Developing the Scorecard backend

Contributor notes for `@red-hat-developer-hub/backstage-plugin-scorecard-backend`. Operator installation stays in [README.md](./README.md).

## Prerequisites

From `workspaces/scorecard`, install dependencies with `yarn install`. Node 22 or 24.

## Local harness

The package `dev/index.ts` starts a backend with mocked auth and one in-memory catalog entity. It does not load metric-provider modules. For one module, use that module's own `dev/` harness and [DEVELOPING.md](../scorecard-backend-module-github/DEVELOPING.md) (the same pattern exists beside each module).

```sh
yarn workspace @red-hat-developer-hub/backstage-plugin-scorecard-backend start
```

`yarn start` loads only this package's `app-config.yaml`. Workspace aggregation KPIs are not applied. The process listens on port 7007. Stop it with Ctrl-C.

Mocked httpAuth accepts the Backstage mock user token below.

```sh
curl -sS -H 'Authorization: Bearer mock-user-token' \
  http://localhost:7007/api/scorecard/metrics
```

```sh
curl -sS -H 'Authorization: Bearer mock-user-token' \
  'http://localhost:7007/api/scorecard/metrics/github.openPRs/catalog/aggregations/entities?namespace=staging'
```

With no metric modules loaded, `GET /api/scorecard/metrics` returns `{ "metrics": [] }`. A missing metric id on the drill-down route returns 404. Request and response fields for that route are documented in [docs/drill-down.md](./docs/drill-down.md).

## Tests

From `workspaces/scorecard`:

```sh
yarn workspace @red-hat-developer-hub/backstage-plugin-scorecard-backend test --watchAll=false
yarn workspace @red-hat-developer-hub/backstage-plugin-scorecard-backend lint
yarn workspace @red-hat-developer-hub/backstage-plugin-scorecard-backend tsc --noEmit
```

`yarn tsc` at the workspace root checks the whole workspace.

## When this harness is not enough

`packages/app` and `packages/app-legacy` already exist so homepage and catalog flows can be exercised with the frontend. Do not add another application package for a backend change. Start them from `workspaces/scorecard` with `yarn start` (new frontend system) or `yarn start:legacy`.

Those full-workspace runs are for UI flows. This backend `dev/` entry is the default loop for REST checks.

Legacy end-to-end tests fulfill the Scorecard HTTP API in the browser. They do not call this backend. A live provider integration belongs in [rhdh-plugin-export-overlays](https://github.com/redhat-developer/rhdh-plugin-export-overlays), not in a new app in this workspace.

The frontend package `dev/` apps use `MockScorecardApi`. They cannot verify these HTTP routes. Use this harness, or a full workspace whose backend includes the Scorecard plugin, for that check.
