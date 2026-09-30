# Developing the GitHub scorecard module

Contributor notes for `@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-github`. Operator installation stays in [README.md](./README.md).

## Prerequisites

From `workspaces/scorecard`, install dependencies with `yarn install`. Node 22 or 24.

## Local harness

`dev/index.ts` starts the Scorecard backend plus this module. Auth and HTTP auth are mocked, and the catalog is one in-memory Component named `sample`. The Scorecard backend default export already installs the collectors service, so this harness does not add that factory again.

```sh
yarn workspace @red-hat-developer-hub/backstage-plugin-scorecard-backend-module-github start
```

`yarn start` loads only this package's `app-config.yaml`. Workspace aggregation KPIs are not applied. The process listens on port 7007. Stop it with Ctrl-C. Mocked httpAuth accepts the Backstage mock user token below.

```sh
curl -sS -H 'Authorization: Bearer mock-user-token' \
  http://localhost:7007/api/scorecard/metrics
```

The response lists `github.openPRs` once the module has registered. Live GitHub calls need a token and integrations in an uncommitted local config file. Do not commit tokens.

## Tests

From `workspaces/scorecard`:

```sh
yarn workspace @red-hat-developer-hub/backstage-plugin-scorecard-backend-module-github test --watchAll=false
yarn workspace @red-hat-developer-hub/backstage-plugin-scorecard-backend-module-github lint
```

`yarn tsc` at the workspace root checks the whole workspace.

## When this harness is not enough

`packages/app` and `packages/app-legacy` already exist for cross-plugin home and catalog flows. Do not add another application package for this module. Start them from `workspaces/scorecard` with `yarn start` or `yarn start:legacy`. The [Scorecard backend guide](../scorecard-backend/DEVELOPING.md) covers the plugin without a metric module.
