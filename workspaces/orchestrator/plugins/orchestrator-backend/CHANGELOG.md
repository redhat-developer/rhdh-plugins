### Dependencies

## 8.6.0

### Minor Changes

- 3e2c3f7: Adding Workflow Logs endpoint. Loki provider added

### Patch Changes

- Updated dependencies [3e2c3f7]
- Updated dependencies [f1b43c5]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.4.0
  - @red-hat-developer-hub/backstage-plugin-orchestrator-node@1.0.0

## 8.5.1

### Patch Changes

- d91ef65: Updated dependency `@types/express` to `4.17.25`.
  Updated dependency `@openapitools/openapi-generator-cli` to `2.25.2`.
- Updated dependencies [8524940]
- Updated dependencies [d91ef65]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.3.1

## 8.5.0

### Minor Changes

- 29dfed0: Backstage version bump to v1.45.2
- 43376f1: Removing the deprecated moment package and replacing with luxon

### Patch Changes

- 40b80fe: Change "lifecycle" to active in catalog-info.yaml
- 40b80fe: Remove "support", "lifecycle" keywords and "supported-versions" in package.json. Change "lifecycle" to active in catalog.yaml
- Updated dependencies [a1671ab]
- Updated dependencies [40b80fe]
- Updated dependencies [782c33f]
- Updated dependencies [f5f4973]
- Updated dependencies [40b80fe]
- Updated dependencies [34a36cb]
- Updated dependencies [29dfed0]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.3.0

## 8.4.0

### Minor Changes

- fba1136: Backstage version bump to v1.44.1

### Patch Changes

- Updated dependencies [fba1136]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.2.0

## 8.3.0

### Minor Changes

- fceb33e: Removal of deprecated package @backstage/backend-tasks

## 8.2.0

### Minor Changes

- de5ced6: Backstage version bump to v1.42.5

### Patch Changes

- Updated dependencies [de5ced6]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.1.0

## 8.1.0

### Minor Changes

- 1a519f8: removal of @backstage/backend-common

## 8.0.6

### Patch Changes

- f0a427c: Added internationalization to the frontend plugins.
- Updated dependencies [f0a427c]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.0.6

## 8.0.5

### Patch Changes

- 121e764: improve abort instance error handling
- Updated dependencies [c79ffa7]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.0.5

## 8.0.4

### Patch Changes

- f868d17: filter last run in wotkflows tab by entity
- Updated dependencies [2fbdb53]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.0.4

## 8.0.3

### Patch Changes

- fac94ef: fix(orchestrator): on retrigger workflow, tokens requested by the AuthRequester are forwarded
- 4fd43f1: filter deleted workflows from workflows table
- Updated dependencies [fac94ef]
- Updated dependencies [16439ad]
- Updated dependencies [4fd43f1]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.0.3

## 8.0.2

### Patch Changes

- 26e602a: add workflows tab to catalog entities
- Updated dependencies [26e602a]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.0.2

## 8.0.1

### Patch Changes

- Updated dependencies [32e0a44]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.0.1

## 8.0.0

### Major Changes

- 3fce49c: Update dependencies to macth Backstage 1.39.1

### Patch Changes

- Updated dependencies [784d858]
- Updated dependencies [3fce49c]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.0.0

## 7.0.1

### Patch Changes

- Updated dependencies [223d35c]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@2.0.1

## 7.0.0

### Major Changes

- 66b7b7c: removing assessment code

### Patch Changes

- a79f849: Updated dependency `prettier` to `3.6.2`.
- d7d2490: enable custom auth provider for executing workflows
- Updated dependencies [e590195]
- Updated dependencies [66b7b7c]
- Updated dependencies [d7d2490]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@2.0.0

## 6.1.4

### Patch Changes

- 1dbc797: Handle errors on fetch calls by adding try/catch blocks and logging
- ff0f69e: update API - fetch executionSummary field
  Use execution summary for results card
- Updated dependencies [ff0f69e]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.28.4

## 6.1.3

### Patch Changes

- Updated dependencies [a3df181]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.28.3

## 6.1.2

### Patch Changes

- Updated dependencies [da78550]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.28.2

## 6.1.1

### Patch Changes

- a9a6095: remove business key
- Updated dependencies [a9a6095]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.28.1

## 6.1.0

### Minor Changes

- 53f3ffb: implemented authorization widget for enabling specifying the required auth providers in the schema so the UI can pick it up from there and forward to workflow execution

### Patch Changes

- d68d693: Updated dependency `@types/express` to `4.17.23`.
- Updated dependencies [53f3ffb]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.28.0

## 6.0.3

### Patch Changes

- 4ecd9f0: Limit access to workflow instances to initiators only
- 9bc8af0: remove failed nodes from previous executions/retriggers
- 3b571b3: Updated dependency `@janus-idp/cli` to `3.6.1`.
- 7509a73: skip cache availability check in selected functions
- Updated dependencies [4ecd9f0]
- Updated dependencies [9bc8af0]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.27.3

## 6.0.2

### Patch Changes

- 7f6ca8a: add filter by variables and nested variables
- Updated dependencies [c6b54ad]
- Updated dependencies [7f6ca8a]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.27.2

## 6.0.1

### Patch Changes

- 56c160b: Add endpoind to ping workflow service
- 571d93e: Updated dependency `@types/express` to `4.17.22`.
- Updated dependencies [56c160b]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.27.1

## 6.0.0

### Major Changes

- ff929e2: feat(orchestrator): capturing the auth tokens from available SCM systems after user logsIn and then send it to backend-plugin.

### Minor Changes

- fc9ce7c: Backstage version bump to v1.37.1

### Patch Changes

- 5214a15: Dev change only - use @janus-idp/cli 3.2.0 instead of 3.5.0
- 3ac726f: add workflow status (available/unavailable)
- fd078b4: Use upstream AuditorService instead of the Janus-specific AuditLogger.
- 2f33284: Update kie-tools, @janus/cli and Backstage supported version to the most recent ones.
- a9e5f32: Updated dependency `@openapitools/openapi-generator-cli` to `2.20.0`.
  Updated dependency `prettier` to `3.5.3`.
  Updated dependency `@redhat-developer/red-hat-developer-hub-theme` to `0.5.1`.
  Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.6.0`.
  Updated dependency `@janus-idp/cli` to `3.5.0`.
- 544c80a: Fix instance fetching to respect permissions
- Updated dependencies [2f33284]
- Updated dependencies [a9e5f32]
- Updated dependencies [fc9ce7c]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.27.0

## 5.2.3

### Patch Changes

- 691fd23: fix tests
- Updated dependencies [691fd23]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.26.2

## 5.2.2

### Patch Changes

- Updated dependencies [29cf5fb]
- Updated dependencies [754a051]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.26.1

## 5.2.1

### Patch Changes

- bad7cb0: updated dev mode to remove git configuration from the workflow repo, added checks for cloning path

## 5.2.0

### Minor Changes

- 967c377: Fixed unsupported filter operators

### Patch Changes

- e3ebb0c: replace abort mutation with call to delete
- 665947d: fix bug in error handling of execute API
- 4e3ccc2: Add retrigger option to UI using v2 API
- d1010f9: improve logging of router
- bee24dc: add unavailable workflows to cache and overview
- b0e3ede: improve data index network error
- 10f17e3: Fixed a typo in FilterBuilder error message
- aebd2b0: improved devMode, added podman and macos support
- Updated dependencies [967c377]
- Updated dependencies [05a1ce0]
- Updated dependencies [816d8bc]
- Updated dependencies [c7de094]
- Updated dependencies [bee24dc]
- Updated dependencies [d4fa6bf]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.26.0

## 5.1.1

### Patch Changes

- d59e940: Updated dependency `@openapitools/openapi-generator-cli` to `2.15.3`.
  Updated dependency `prettier` to `3.4.2`.
  Updated dependency `@janus-idp/cli` to `1.19.1`.
  Updated dependency `monaco-editor` to `0.52.2`.
  Updated dependency `monaco-yaml` to `5.2.3`.
  Updated dependency `sass` to `1.83.0`.
  Updated dependency `webpack` to `5.97.1`.
- Updated dependencies [d59e940]
- Updated dependencies [9cc8c89]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.25.1

## 5.1.0

### Minor Changes

- 5ab913b: Access can now be managed on a per-workflow basis.

### Patch Changes

- 5b90f96: resolve dependency issues
- Updated dependencies [5b90f96]
- Updated dependencies [5ab913b]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.25.0

## 5.0.1

### Patch Changes

- 9156260: Fixes the workflow editor
- 1d4cfa1: update openapi flpath-1893
- 6a71932: added export-dynamic scripts
- Updated dependencies [b6cf167]
- Updated dependencies [1d4cfa1]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.24.3

## 5.0.0

### Major Changes

- 9547093: fix SonataFlowService.ts:fetchWorkflowOverviewBySource to fetch less instances

### Patch Changes

- 9f61eb0: execute API should allow no inputs
- 0703b6a: we fail when workflow has 0 instances
- bab8daa: The parent assessment link is shown again thanks to fixing passing of the businessKey when "execute" action is trigerred.
- Updated dependencies [9f61eb0]
- Updated dependencies [bab8daa]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.24.2

## 4.1.1

### Patch Changes

- 54daa8c: Migrated from [janus-idp/backstage-plugins](https://github.com/janus-idp/backstage-plugins).
- Updated dependencies [54daa8c]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.24.1

## 4.1.0

### Minor Changes

- 25f1787: Add enum filters to orchestrator plugin
- 603a162: make error handling consistent in backend and UI

### Patch Changes

- Updated dependencies [25f1787]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.24.0

## 4.0.1

### Patch Changes

- 0e6bfd3: feat: update Backstage to the latest version

  Update to Backstage 1.32.5

- Updated dependencies [0e6bfd3]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.23.1
  - @janus-idp/backstage-plugin-audit-log-node@1.7.1
  - @janus-idp/backstage-plugin-rbac-common@1.12.1

## 4.0.0

### Minor Changes

- 8244f28: chore(deps): update to backstage 1.32

### Patch Changes

- Updated dependencies [8244f28]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.23.0
  - @janus-idp/backstage-plugin-audit-log-node@1.7.0
  - @janus-idp/backstage-plugin-rbac-common@1.12.0

## 3.0.1

### Patch Changes

- 7342e9b: chore: remove @janus-idp/cli dep and relink local packages

  This update removes `@janus-idp/cli` from all plugins, as it’s no longer necessary. Additionally, packages are now correctly linked with a specified version.

## 3.0.0

### Minor Changes

- d9551ae: feat(deps): update to backstage 1.31

### Patch Changes

- d9551ae: Change local package references to a `*`
- d9551ae: pin the @janus-idp/cli package
- d9551ae: upgrade to yarn v3
- d9551ae: Change the export-dynamic script to no longer use any flags and remove the tracking of the dist-dynamic folder
- Updated dependencies [d9551ae]
- Updated dependencies [d9551ae]
- Updated dependencies [d9551ae]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.22.0
  - @janus-idp/backstage-plugin-rbac-common@1.11.0
  - @janus-idp/backstage-plugin-audit-log-node@1.6.0

* **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.21.0

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.20.0
- **@janus-idp/cli:** upgraded to 1.15.2

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.19.0

### Dependencies

- **@janus-idp/backstage-plugin-audit-log-node:** upgraded to 1.5.1

### Dependencies

- **@janus-idp/cli:** upgraded to 1.15.1

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.18.2

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.18.1

### Dependencies

- **@janus-idp/cli:** upgraded to 1.15.0

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.18.0

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.17.3

### Dependencies

- **@janus-idp/cli:** upgraded to 1.14.0
- **@janus-idp/backstage-plugin-audit-log-node:** upgraded to 1.5.0
- **@janus-idp/backstage-plugin-rbac-common:** upgraded to 1.10.0

### Dependencies

- **@janus-idp/cli:** upgraded to 1.13.2

### Dependencies

- **@janus-idp/backstage-plugin-audit-log-node:** upgraded to 1.4.1

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.17.2

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.17.1

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.17.0

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.16.0

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.15.2

### Dependencies

- **@janus-idp/backstage-plugin-rbac-common:** upgraded to 1.9.0

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.15.1

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.15.0

### Dependencies

- **@janus-idp/cli:** upgraded to 1.13.1

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.14.0

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.17.3](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.17.2...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.17.3) (2024-08-06)

### Dependencies

- **@janus-idp/backstage-plugin-rbac-common:** upgraded to 1.8.2

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.17.2](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.17.1...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.17.2) (2024-08-05)

### Dependencies

- **@janus-idp/backstage-plugin-rbac-common:** upgraded to 1.8.1

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.17.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.17.0...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.17.1) (2024-08-02)

### Bug Fixes

- **orchestrator:** remove default pagination on v2 endpoints ([#1983](https://github.com/janus-idp/backstage-plugins/issues/1983)) ([5e30274](https://github.com/janus-idp/backstage-plugins/commit/5e302748a25cbad127122407e5258576054eac3d))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.13.1

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.17.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.16.1...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.17.0) (2024-07-26)

### Features

- **deps:** update to backstage 1.29 ([#1900](https://github.com/janus-idp/backstage-plugins/issues/1900)) ([f53677f](https://github.com/janus-idp/backstage-plugins/commit/f53677fb02d6df43a9de98c43a9f101a6db76802))
- **orchestrator:** use v2 endpoints to retrieve instances ([#1956](https://github.com/janus-idp/backstage-plugins/issues/1956)) ([537502b](https://github.com/janus-idp/backstage-plugins/commit/537502b9d2ac13f2fb3f79188422d2c6e97f41fb))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.13.0
- **@janus-idp/backstage-plugin-rbac-common:** upgraded to 1.8.0

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.16.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.16.0...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.16.1) (2024-07-24)

### Bug Fixes

- **deps:** rollback unreleased plugins ([#1951](https://github.com/janus-idp/backstage-plugins/issues/1951)) ([8b77969](https://github.com/janus-idp/backstage-plugins/commit/8b779694f02f8125587296305276b84cdfeeaebe))

### Dependencies

- **@janus-idp/backstage-plugin-rbac-common:** upgraded to 1.7.2

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.16.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.15.0...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.16.0) (2024-07-24)

### Features

- **deps:** update to backstage 1.28 ([#1891](https://github.com/janus-idp/backstage-plugins/issues/1891)) ([1ba1108](https://github.com/janus-idp/backstage-plugins/commit/1ba11088e0de60e90d138944267b83600dc446e5))
- **orchestrator:** use v2 endpoints to retrieve workflow overviews ([#1892](https://github.com/janus-idp/backstage-plugins/issues/1892)) ([cca1e53](https://github.com/janus-idp/backstage-plugins/commit/cca1e53bc6b3019b1c544f2f62bed8723ebf6130))

### Bug Fixes

- **orchestrator:** resolve broken dynamic plugin publish ([#1906](https://github.com/janus-idp/backstage-plugins/issues/1906)) ([5f99043](https://github.com/janus-idp/backstage-plugins/commit/5f990438ebebf8b23c0c8706852753ad0812c55a))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.12.0

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.15.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.14.0...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.15.0) (2024-07-12)

### Features

- **orchestrator:** fix version ([#1886](https://github.com/janus-idp/backstage-plugins/issues/1886)) ([65c5917](https://github.com/janus-idp/backstage-plugins/commit/65c5917b8fc066a869d1a8e76d5e7b6cb4c8327c))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.11.0

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.14.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.13.1...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.14.0) (2024-07-11)

### Features

- **orchestrator:** change openapi client generator ([#1864](https://github.com/janus-idp/backstage-plugins/issues/1864)) ([d6a4f4c](https://github.com/janus-idp/backstage-plugins/commit/d6a4f4ccfedfd55356305131029fd3d8ca0ab9c5))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.11.0

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.13.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.13.0...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.13.1) (2024-07-01)

### Bug Fixes

- **rbac:** update rbac common to fix compilation ([#1858](https://github.com/janus-idp/backstage-plugins/issues/1858)) ([48f142b](https://github.com/janus-idp/backstage-plugins/commit/48f142b447f0d1677ba3f16b2a3c8972b22d0588))

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.13.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.12.0...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.13.0) (2024-06-28)

### Features

- **orchestrator:** fix build failure from [#1833](https://github.com/janus-idp/backstage-plugins/issues/1833) ([#1850](https://github.com/janus-idp/backstage-plugins/issues/1850)) ([c0c73e6](https://github.com/janus-idp/backstage-plugins/commit/c0c73e638f66c03dae565614b8186938b38d7032))
- **orchestrator:** remove unneeded orchestrator jira integration and endpoint ([#1833](https://github.com/janus-idp/backstage-plugins/issues/1833)) ([d2a76fd](https://github.com/janus-idp/backstage-plugins/commit/d2a76fd3db028f9774c821759bee5f38b7131c94))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.10.0

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.12.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.11.0...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.12.0) (2024-06-26)

### Features

- **orchestrator:** disable buttons based on permissions ([#1818](https://github.com/janus-idp/backstage-plugins/issues/1818)) ([36504b0](https://github.com/janus-idp/backstage-plugins/commit/36504b05d96dbbf0b2395dc6e5c155c21fa73bcd))

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.11.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.10.1...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.11.0) (2024-06-25)

### Features

- **orchestrator:** add auditLog and reorganize endpoints declaration ([#1820](https://github.com/janus-idp/backstage-plugins/issues/1820)) ([00d9216](https://github.com/janus-idp/backstage-plugins/commit/00d9216ba76c13fac86933a8605102d6e1768929))

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.10.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.10.0...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.10.1) (2024-06-19)

### Bug Fixes

- **orchestrator:** change log level of cache messages to be debug ([#1824](https://github.com/janus-idp/backstage-plugins/issues/1824)) ([4224612](https://github.com/janus-idp/backstage-plugins/commit/422461224e31b419cd8394e2432af71ed10a986e))

### Dependencies

- **@janus-idp/cli:** upgraded to 1.11.1

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.10.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.9.8...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.10.0) (2024-06-13)

### Features

- **deps:** update to backstage 1.27 ([#1683](https://github.com/janus-idp/backstage-plugins/issues/1683)) ([a14869c](https://github.com/janus-idp/backstage-plugins/commit/a14869c3f4177049cb8d6552b36c3ffd17e7997d))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.9.0
- **@janus-idp/cli:** upgraded to 1.11.0

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.9.8](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.9.7...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.9.8) (2024-06-13)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.10.1

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.9.7](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.9.6...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.9.7) (2024-06-11)

### Bug Fixes

- **orchestrator:** fix error handling in case data index failed to start ([#1804](https://github.com/janus-idp/backstage-plugins/issues/1804)) ([27affb7](https://github.com/janus-idp/backstage-plugins/commit/27affb7815e02127721fd854f7903dca3525dede))

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.9.6](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.9.5...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.9.6) (2024-06-05)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.10.0

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.9.5](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.9.4...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.9.5) (2024-06-04)

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.8.1

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.9.4](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.9.3...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.9.4) (2024-06-03)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.9.0

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.9.3](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.9.2...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.9.3) (2024-05-29)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.8.10

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.9.2](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.9.1...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.9.2) (2024-05-29)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.8.9

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.9.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.9.0...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.9.1) (2024-05-28)

### Bug Fixes

- **orchestrator:** fixed broken workflow viewer ([#1717](https://github.com/janus-idp/backstage-plugins/issues/1717)) ([19cc79b](https://github.com/janus-idp/backstage-plugins/commit/19cc79bb9c1422556ddb9f85a2ac323186808321))

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.9.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.8.7...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.9.0) (2024-05-22)

### Features

- **orchestrator:** add permissions to orchestrator plugin ([#1599](https://github.com/janus-idp/backstage-plugins/issues/1599)) ([d0a4531](https://github.com/janus-idp/backstage-plugins/commit/d0a453181e177eb1da7b1e231253b76a2d9356a8))

### Bug Fixes

- **orchestrator:** fix the common package reference version ([#1704](https://github.com/janus-idp/backstage-plugins/issues/1704)) ([942b2a3](https://github.com/janus-idp/backstage-plugins/commit/942b2a3b6eb29c0fe88f9c98dea581309d02fded))

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.8.7](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.8.6...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.8.7) (2024-05-21)

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.8.6](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.8.5...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.8.6) (2024-05-20)

### Bug Fixes

- **orchestrator:** fixes many security-related issues ([#1681](https://github.com/janus-idp/backstage-plugins/issues/1681)) ([3e801c8](https://github.com/janus-idp/backstage-plugins/commit/3e801c84015f925bdecd226a161ef81a5fc69432))

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.8.5](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.8.4...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.8.5) (2024-05-16)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.8.7

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.8.4](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.8.3...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.8.4) (2024-05-15)

### Documentation

- **orchestrator:** removes instructions related to the editor ([#1664](https://github.com/janus-idp/backstage-plugins/issues/1664)) ([10a75b2](https://github.com/janus-idp/backstage-plugins/commit/10a75b2706c72751bd774d6fae4332bbc527dc2b))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.7.2

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.8.3](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.8.2...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.8.3) (2024-05-15)

### Bug Fixes

- **orchestrator:** export the `OrchestratorPlugin` accordingly ([#1644](https://github.com/janus-idp/backstage-plugins/issues/1644)) ([4a9d1f8](https://github.com/janus-idp/backstage-plugins/commit/4a9d1f821a30437e73631fac98b1aabc65473fba))

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.8.2](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.8.1...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.8.2) (2024-05-09)

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.7.1
- **@janus-idp/cli:** upgraded to 1.8.6

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.8.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.8.0...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.8.1) (2024-05-09)

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.7.0

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.8.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.7.4...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.8.0) (2024-05-06)

### Features

- **orchestrator:** make the internal sonata podman compatible ([#1612](https://github.com/janus-idp/backstage-plugins/issues/1612)) ([e4e528e](https://github.com/janus-idp/backstage-plugins/commit/e4e528e2c10536d029ffec11953f3a1d0309b0c5))

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.7.4](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.7.3...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.7.4) (2024-05-02)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.8.5

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.7.3](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.7.2...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.7.3) (2024-05-02)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.8.4

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.7.2](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.7.1...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.7.2) (2024-04-30)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.8.3

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.7.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.7.0...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.7.1) (2024-04-30)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.8.2

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.7.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.6.8...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.7.0) (2024-04-25)

### Features

- **orchestrator:** add endpoint to retrigger workflow in error state ([#1343](https://github.com/janus-idp/backstage-plugins/issues/1343)) ([328d23a](https://github.com/janus-idp/backstage-plugins/commit/328d23a7992da125becc8d7775a4ebd68165f243))

### Dependencies

- **@janus-idp/cli:** upgraded to 1.8.1

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.6.8](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.6.7...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.6.8) (2024-04-18)

### Bug Fixes

- **orchestrator:** allows serving the editor envelope in disconnected environments ([#1450](https://github.com/janus-idp/backstage-plugins/issues/1450)) ([1e778d8](https://github.com/janus-idp/backstage-plugins/commit/1e778d88336dfec79d48ece4fd8d2a035133b70e))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.6.4

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.6.7](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.6.6...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.6.7) (2024-04-15)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.8.0

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.6.6](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.6.5...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.6.6) (2024-04-09)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.7.10

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.6.5](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.6.4...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.6.5) (2024-04-09)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.7.9

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.6.4](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.6.3...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.6.4) (2024-04-05)

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.6.3
- **@janus-idp/cli:** upgraded to 1.7.8

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.6.3](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.6.2...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.6.3) (2024-04-04)

### Bug Fixes

- **orchestrator:** add lastRunId to overview endpoints ([#1449](https://github.com/janus-idp/backstage-plugins/issues/1449)) ([cce56f7](https://github.com/janus-idp/backstage-plugins/commit/cce56f7de3acc41ecd30b1b9962d7817be69de7d))
- **orchestrator:** only inputs inherited from the assessment workflow should be disabled ([#1436](https://github.com/janus-idp/backstage-plugins/issues/1436)) ([32d9bdf](https://github.com/janus-idp/backstage-plugins/commit/32d9bdfc38c07c4e60f0ce7670fc3813ad0d92c3))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.6.2

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.6.2](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.6.1...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.6.2) (2024-04-02)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.7.7

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.6.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.6.0...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.6.1) (2024-03-29)

### Bug Fixes

- **orchestrator:** fixes v2/instances endpoint ([#1414](https://github.com/janus-idp/backstage-plugins/issues/1414)) ([88b49df](https://github.com/janus-idp/backstage-plugins/commit/88b49df35cf10e231ba69c239e873cb10e7cc25b))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.6.1
- **@janus-idp/cli:** upgraded to 1.7.6

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.6.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.5.3...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.6.0) (2024-03-14)

### Features

- **orchestrator:** verify availability and cache workflow definition IDs ([#1309](https://github.com/janus-idp/backstage-plugins/issues/1309)) ([4d322f1](https://github.com/janus-idp/backstage-plugins/commit/4d322f1fc5b6f8b1afedf40cfe1b24b2edae2ac1))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.6.0

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.5.3](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.5.2...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.5.3) (2024-03-12)

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.5.1

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.5.2](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.5.1...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.5.2) (2024-03-11)

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.5.0

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.5.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.5.0...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.5.1) (2024-03-11)

### Other changes

- **orchestrator:** add unit tests for v2 endpoints ([#1300](https://github.com/janus-idp/backstage-plugins/issues/1300)) ([9a13138](https://github.com/janus-idp/backstage-plugins/commit/9a13138c61d3cc7331f739da80f020bb68dd61e5))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.4.1

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.5.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.4.12...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.5.0) (2024-03-07)

### Features

- **orchestrator:** support pagination for /instances and /overview ([#1313](https://github.com/janus-idp/backstage-plugins/issues/1313)) ([79d5988](https://github.com/janus-idp/backstage-plugins/commit/79d598816f16c8346b6868bff4cc30d695cad518))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.4.0

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.4.12](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.4.11...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.4.12) (2024-03-04)

### Bug Fixes

- **orchestrator:** increase the number of attempts to fetch the instance after execution ([#1301](https://github.com/janus-idp/backstage-plugins/issues/1301)) ([77dcce3](https://github.com/janus-idp/backstage-plugins/commit/77dcce3adceaf12b583bda5e74be69a5cc273ba1))

### Dependencies

- **@janus-idp/cli:** upgraded to 1.7.5

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.4.11](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.4.10...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.4.11) (2024-03-03)

### Bug Fixes

- **orchestrator:** stop fetching workflow URI ([#1297](https://github.com/janus-idp/backstage-plugins/issues/1297)) ([2456a28](https://github.com/janus-idp/backstage-plugins/commit/2456a287dbff955a0916b9600e89a39511cd537a))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.3.7

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.4.10](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.4.9...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.4.10) (2024-02-29)

### Bug Fixes

- **orchestrator:** refactor 500 response to use ErrorResponse object ([#1290](https://github.com/janus-idp/backstage-plugins/issues/1290)) ([2580f3d](https://github.com/janus-idp/backstage-plugins/commit/2580f3d38cecf78334964666eb7c127c21b00924))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.3.6

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.4.9](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.4.8...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.4.9) (2024-02-28)

### Bug Fixes

- **orchestrator:** clean up the plugin code ([#1292](https://github.com/janus-idp/backstage-plugins/issues/1292)) ([ad27fb8](https://github.com/janus-idp/backstage-plugins/commit/ad27fb8e98913a6b80feb38ff58a7864e1953a7e))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.3.5

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.4.8](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.4.7...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.4.8) (2024-02-28)

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.3.4

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.4.7](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.4.6...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.4.7) (2024-02-28)

### Bug Fixes

- **orchestrator:** handle nullable start/state properties of process instance ([#1277](https://github.com/janus-idp/backstage-plugins/issues/1277)) ([d8a43a5](https://github.com/janus-idp/backstage-plugins/commit/d8a43a5a164f83fc90d037ae3d7a355f5de543e0))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.3.3

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.4.6](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.4.5...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.4.6) (2024-02-27)

### Bug Fixes

- **orchestrator:** workflowId parameter wrongly parsed in getWorkflowOverviewById (v2) ([#1283](https://github.com/janus-idp/backstage-plugins/issues/1283)) ([2cd70d0](https://github.com/janus-idp/backstage-plugins/commit/2cd70d048d707a3b117c5273a1d8bc9fdc03fff7))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.3.2

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.4.5](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.4.4...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.4.5) (2024-02-27)

### Bug Fixes

- **orchestrator:** warn "unknown format X ignored in schema at path Y" ([#1270](https://github.com/janus-idp/backstage-plugins/issues/1270)) ([de3c734](https://github.com/janus-idp/backstage-plugins/commit/de3c734299189b753d924c87aa9b5c9b5f94683c)), closes [/github.com/janus-idp/backstage-plugins/blob/903c7f37a1cf138ac96ef3f631f951866c2014fa/plugins/notifications-backend/src/service/router.ts#L45-L52](https://github.com/janus-idp//github.com/janus-idp/backstage-plugins/blob/903c7f37a1cf138ac96ef3f631f951866c2014fa/plugins/notifications-backend/src/service/router.ts/issues/L45-L52)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.7.4

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.4.4](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.4.3...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.4.4) (2024-02-26)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.7.3

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.4.3](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.4.2...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.4.3) (2024-02-23)

### Bug Fixes

- **orchestrator:** handle api endpoint failure ([#1254](https://github.com/janus-idp/backstage-plugins/issues/1254)) ([503de1b](https://github.com/janus-idp/backstage-plugins/commit/503de1b028e134cafb5a04045068768f30519409))

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.4.2](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.4.1...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.4.2) (2024-02-22)

### Bug Fixes

- **orchestrator:** improvements to backend services ([#1252](https://github.com/janus-idp/backstage-plugins/issues/1252)) ([af8e072](https://github.com/janus-idp/backstage-plugins/commit/af8e072f35bc033f5111207c87711c9c0f9ff386))

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.4.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.4.0...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.4.1) (2024-02-21)

### Bug Fixes

- **orchestrator:** implementation of getWorkflowById (v2) ([#1233](https://github.com/janus-idp/backstage-plugins/issues/1233)) ([f9f9008](https://github.com/janus-idp/backstage-plugins/commit/f9f9008d29f244c2ae6d688d3e2dc9b65b705e5b))
- **orchestrator:** minor improvements and fixes ([#1242](https://github.com/janus-idp/backstage-plugins/issues/1242)) ([c9ec4cb](https://github.com/janus-idp/backstage-plugins/commit/c9ec4cbe1847268e8068edc69c7937c5e133c315))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.3.1
- **@janus-idp/cli:** upgraded to 1.7.2

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.4.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.3.1...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.4.0) (2024-02-20)

### Features

- **orchestrator:** add OpenAPI v2 implementations ([#1182](https://github.com/janus-idp/backstage-plugins/issues/1182)) ([43ac2f3](https://github.com/janus-idp/backstage-plugins/commit/43ac2f3f492b5c977142a3cfd9868d5e193ceb02))

### Bug Fixes

- **orchestrator:** decommission the ProcessInstance.lastUpdate field ([#1230](https://github.com/janus-idp/backstage-plugins/issues/1230)) ([9724e27](https://github.com/janus-idp/backstage-plugins/commit/9724e27eaa84fe73d7724f28c86409681b7f79f8))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.3.0

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.3.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.3.0...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.3.1) (2024-02-16)

### Bug Fixes

- **orchestrator:** resolve mismatch between execution data and composed schema ([#1217](https://github.com/janus-idp/backstage-plugins/issues/1217)) ([af85114](https://github.com/janus-idp/backstage-plugins/commit/af851148935e1ed083709cac145520d7551de737))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.2.1

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.3.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.2.2...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.3.0) (2024-02-16)

### Features

- **orchestrator:** add OpenAPI support ([#1123](https://github.com/janus-idp/backstage-plugins/issues/1123)) ([bd88e23](https://github.com/janus-idp/backstage-plugins/commit/bd88e2304c93761ce6754985074f004a5a3c8c4b))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.2.0

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.2.2](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.2.1...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.2.2) (2024-02-13)

### Bug Fixes

- **orchestrator:** filter out `null` values from action input ([#1199](https://github.com/janus-idp/backstage-plugins/issues/1199)) ([55c3927](https://github.com/janus-idp/backstage-plugins/commit/55c3927fb5211e1ec78719fd38740eb29e481962))

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.2.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.2.0...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.2.1) (2024-02-05)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.7.1

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.2.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.1.0...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.2.0) (2024-02-02)

### Features

- **orchestrator:** add the ability to rerun workflows in a new instance ([#1141](https://github.com/janus-idp/backstage-plugins/issues/1141)) ([fe326df](https://github.com/janus-idp/backstage-plugins/commit/fe326df569caa5a9e7b7ec809c1c371a2a936010))

### Bug Fixes

- add missing alpha dynamic plugin entry points ([#1161](https://github.com/janus-idp/backstage-plugins/issues/1161)) ([36e9d91](https://github.com/janus-idp/backstage-plugins/commit/36e9d910b8f534fd9db2f8210c9aa7a24560f01d))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.1.0

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.1.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.0.2...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.1.0) (2024-01-30)

### Features

- add new backend system support for existing backend plugins that have not been migrated over yet ([#1132](https://github.com/janus-idp/backstage-plugins/issues/1132)) ([06e16fd](https://github.com/janus-idp/backstage-plugins/commit/06e16fdcf64257dd08297cb727445d9a8a23c522))

### Dependencies

- **@janus-idp/cli:** upgraded to 1.7.0

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.0.2](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.0.1...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.0.2) (2024-01-25)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.6.0

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend [1.0.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.0.0...@red-hat-developer-hub/backstage-plugin-orchestrator-backend@1.0.1) (2024-01-18)

### Bug Fixes

- **orchestrator:** regenerate `orchestrator-backend/dist-dynamic/package.json` ([#1083](https://github.com/janus-idp/backstage-plugins/issues/1083)) ([8a8051c](https://github.com/janus-idp/backstage-plugins/commit/8a8051c5eded7bdd3e05d1532e8354709aaccb8b))

## @red-hat-developer-hub/backstage-plugin-orchestrator-backend 1.0.0 (2024-01-17)

### Features

- **orchestrator:** add orchestrator plugin ([#783](https://github.com/janus-idp/backstage-plugins/issues/783)) ([cf5fe74](https://github.com/janus-idp/backstage-plugins/commit/cf5fe74db6992d9f51f5073bbcf20c8c346357a1)), closes [#28](https://github.com/janus-idp/backstage-plugins/issues/28) [#38](https://github.com/janus-idp/backstage-plugins/issues/38) [#35](https://github.com/janus-idp/backstage-plugins/issues/35) [#21](https://github.com/janus-idp/backstage-plugins/issues/21)

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.0.0
