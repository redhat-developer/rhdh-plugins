# Developing the Scorecard frontend

Contributor notes for `@red-hat-developer-hub/backstage-plugin-scorecard`. Operator installation stays in [README.md](./README.md).

## Prerequisites

From `workspaces/scorecard`, install dependencies with `yarn install`. Node 22 or 24.

## Local harness

Both frontend dev entries mount the plugin with `MockScorecardApi`. They do not call a Scorecard backend, so they cannot verify drill-down HTTP, query encoding, or a live metrics response. Use them to work on layout and components. For a real API check, start the [backend harness](../scorecard-backend/DEVELOPING.md) or the full workspace.

New Frontend System (default `yarn start` for this package):

```sh
yarn workspace @red-hat-developer-hub/backstage-plugin-scorecard start
```

Legacy frontend:

```sh
yarn workspace @red-hat-developer-hub/backstage-plugin-scorecard start:legacy
```

Stop either process with Ctrl-C.

## Tests

From `workspaces/scorecard`:

```sh
yarn workspace @red-hat-developer-hub/backstage-plugin-scorecard test --watchAll=false
yarn workspace @red-hat-developer-hub/backstage-plugin-scorecard lint
```

`yarn tsc` at the workspace root checks the whole workspace.

## When this harness is not enough

`packages/app` and `packages/app-legacy` already cover cross-plugin home and catalog flows. Do not add another application package for Scorecard work. From `workspaces/scorecard`:

```sh
yarn start
yarn start:legacy
```

`yarn test:e2e:all` runs the legacy and new-frontend end-to-end suites. Those tests fulfill the Scorecard API in the browser. They are not a merge gate for a backend contract change. A live backend integration belongs in [rhdh-plugin-export-overlays](https://github.com/redhat-developer/rhdh-plugin-export-overlays).
