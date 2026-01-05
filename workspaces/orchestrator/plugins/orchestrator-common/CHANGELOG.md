## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.13.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.13.0...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.13.1) (2024-08-02)

## 3.3.1

### Patch Changes

- 8524940: Fix TypeScript compilation errors in orchestrator plugins
- d91ef65: Updated dependency `@types/express` to `4.17.25`.
  Updated dependency `@openapitools/openapi-generator-cli` to `2.25.2`.

## 3.3.0

### Minor Changes

- 782c33f: Removal and updating outdated and unmaintained dependencies
- 34a36cb: Update @serverlessworkflow/sdk-typescript to the correct module name and latest version
- 29dfed0: Backstage version bump to v1.45.2

### Patch Changes

- a1671ab: The js-yaml-cli package was removed in error here: #1735 . While it is not being used in the code, it is used to generate the API for the router
- 40b80fe: Change "lifecycle" to active in catalog-info.yaml
- f5f4973: Updated dependency `@openapitools/openapi-generator-cli` to `2.25.0`.
  Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.10.0`.
- 40b80fe: Remove "support", "lifecycle" keywords and "supported-versions" in package.json. Change "lifecycle" to active in catalog.yaml

## 3.2.0

### Minor Changes

- fba1136: Backstage version bump to v1.44.1

## 3.1.0

### Minor Changes

- de5ced6: Backstage version bump to v1.42.5

## 3.0.6

### Patch Changes

- f0a427c: Added internationalization to the frontend plugins.

## 3.0.5

### Patch Changes

- c79ffa7: Updated dependency `@openapitools/openapi-generator-cli` to `2.22.0`.

## 3.0.4

### Patch Changes

- 2fbdb53: remove setting inputs as readonly when execute from nextWorkflows as this was part of deprecated assessment workflow type

## 3.0.3

### Patch Changes

- fac94ef: fix(orchestrator): on retrigger workflow, tokens requested by the AuthRequester are forwarded
- 16439ad: A workflow can newly produce result values in the "markdown" format.
- 4fd43f1: filter deleted workflows from workflows table

## 3.0.2

### Patch Changes

- 26e602a: add workflows tab to catalog entities

## 3.0.1

### Patch Changes

- 32e0a44: https://issues.redhat.com/browse/FLPATH-2493

## 3.0.0

### Major Changes

- 3fce49c: Update dependencies to macth Backstage 1.39.1

### Patch Changes

- 784d858: Updated dependency `@openapitools/openapi-generator-cli` to `2.21.4`.

## 2.0.1

### Patch Changes

- 223d35c: Updated dependency `@openapitools/openapi-generator-cli` to `2.21.3`.

## 2.0.0

### Major Changes

- 66b7b7c: removing assessment code

### Patch Changes

- e590195: Updated dependency `@openapitools/openapi-generator-cli` to `2.21.2`.
- d7d2490: enable custom auth provider for executing workflows

## 1.28.4

### Patch Changes

- ff0f69e: update API - fetch executionSummary field
  Use execution summary for results card

## 1.28.3

### Patch Changes

- a3df181: Updated dependency `@openapitools/openapi-generator-cli` to `2.21.0`.

## 1.28.2

### Patch Changes

- da78550: Updated dependency `@openapitools/openapi-generator-cli` to `2.20.5`.

## 1.28.1

### Patch Changes

- a9a6095: removing business key

## 1.28.0

### Minor Changes

- 53f3ffb: implemented authorization widget for enabling specifying the required auth providers in the schema so the UI can pick it up from there and forward to workflow execution

## 1.27.3

### Patch Changes

- 4ecd9f0: Limit access to workflow instances to initiators only
- 9bc8af0: remove failed nodes from previous executions/retriggers

## 1.27.2

### Patch Changes

- c6b54ad: Updated dependency `@openapitools/openapi-generator-cli` to `2.20.2`.
- 7f6ca8a: add filter by variables and nested variables

## 1.27.1

### Patch Changes

- 56c160b: Add endpoind to ping workflow service

## 1.27.0

### Minor Changes

- fc9ce7c: Backstage version bump to v1.37.1

### Patch Changes

- 2f33284: Update kie-tools, @janus/cli and Backstage supported version to the most recent ones.
- a9e5f32: Updated dependency `@openapitools/openapi-generator-cli` to `2.20.0`.
  Updated dependency `prettier` to `3.5.3`.
  Updated dependency `@redhat-developer/red-hat-developer-hub-theme` to `0.5.1`.
  Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.6.0`.
  Updated dependency `@janus-idp/cli` to `3.5.0`.

## 1.26.2

### Patch Changes

- 691fd23: fix tests

## 1.26.1

### Patch Changes

- 29cf5fb: Limit viewable component to specific roles
- 754a051: Adapt UI for completedWith field removal

## 1.26.0

### Minor Changes

- 967c377: Fixed unsupported filter operators

### Patch Changes

- 05a1ce0: Updated dependency `@openapitools/openapi-generator-cli` to `2.16.3`.
- 816d8bc: Updated dependency `@openapitools/openapi-generator-cli` to `2.16.2`.
- c7de094: add orchestrator.workflow.use among permissions in the RBAC UI
- bee24dc: add unavailable workflows to cache and overview
- d4fa6bf: use 'update' policy for orchestrator.workflow.use

## 1.25.1

### Patch Changes

- d59e940: Updated dependency `@openapitools/openapi-generator-cli` to `2.15.3`.
  Updated dependency `prettier` to `3.4.2`.
  Updated dependency `@janus-idp/cli` to `1.19.1`.
  Updated dependency `monaco-editor` to `0.52.2`.
  Updated dependency `monaco-yaml` to `5.2.3`.
  Updated dependency `sass` to `1.83.0`.
  Updated dependency `webpack` to `5.97.1`.
- 9cc8c89: update sonataflow devmode image

## 1.25.0

### Minor Changes

- 5ab913b: Access can now be managed on a per-workflow basis.

### Patch Changes

- 5b90f96: resolve dependency issues

## 1.24.3

### Patch Changes

- b6cf167: generate openapi spec api-doc
- 1d4cfa1: update openapi flpath-1893

## 1.24.2

### Patch Changes

- 9f61eb0: execute API should allow no inputs
- bab8daa: The parent assessment link is shown again thanks to fixing passing of the businessKey when "execute" action is trigerred.

## 1.24.1

### Patch Changes

- 54daa8c: Migrated from [janus-idp/backstage-plugins](https://github.com/janus-idp/backstage-plugins).

## 1.24.0

### Minor Changes

- 25f1787: Add enum filters to orchestrator plugin

## 1.23.1

### Patch Changes

- 0e6bfd3: feat: update Backstage to the latest version

  Update to Backstage 1.32.5

## 1.23.0

### Minor Changes

- 8244f28: chore(deps): update to backstage 1.32

## 1.22.1

### Patch Changes

- 8bd8660: fix(orchestrator): fix typo in package resolution

## 1.22.0

### Minor Changes

- d9551ae: feat(deps): update to backstage 1.31

### Patch Changes

- d9551ae: change deps to peer deps in common packages
- d9551ae: upgrade to yarn v3

### Bug Fixes

- **orchestrator:** remove default pagination on v2 endpoints ([#1983](https://github.com/janus-idp/backstage-plugins/issues/1983)) ([5e30274](https://github.com/janus-idp/backstage-plugins/commit/5e302748a25cbad127122407e5258576054eac3d))

## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.13.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.12.0...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.13.0) (2024-07-26)

### Features

- **deps:** update to backstage 1.29 ([#1900](https://github.com/janus-idp/backstage-plugins/issues/1900)) ([f53677f](https://github.com/janus-idp/backstage-plugins/commit/f53677fb02d6df43a9de98c43a9f101a6db76802))
- **orchestrator:** use v2 endpoints to retrieve instances ([#1956](https://github.com/janus-idp/backstage-plugins/issues/1956)) ([537502b](https://github.com/janus-idp/backstage-plugins/commit/537502b9d2ac13f2fb3f79188422d2c6e97f41fb))

## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.12.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.11.0...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.12.0) (2024-07-24)

### Features

- **deps:** update to backstage 1.28 ([#1891](https://github.com/janus-idp/backstage-plugins/issues/1891)) ([1ba1108](https://github.com/janus-idp/backstage-plugins/commit/1ba11088e0de60e90d138944267b83600dc446e5))
- **orchestrator:** use v2 endpoints to retrieve workflow overviews ([#1892](https://github.com/janus-idp/backstage-plugins/issues/1892)) ([cca1e53](https://github.com/janus-idp/backstage-plugins/commit/cca1e53bc6b3019b1c544f2f62bed8723ebf6130))

## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.10.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.9.0...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.10.0) (2024-06-28)

### Features

- **orchestrator:** remove unneeded orchestrator jira integration and endpoint ([#1833](https://github.com/janus-idp/backstage-plugins/issues/1833)) ([d2a76fd](https://github.com/janus-idp/backstage-plugins/commit/d2a76fd3db028f9774c821759bee5f38b7131c94))

## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.9.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.8.1...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.9.0) (2024-06-13)

### Features

- **deps:** update to backstage 1.27 ([#1683](https://github.com/janus-idp/backstage-plugins/issues/1683)) ([a14869c](https://github.com/janus-idp/backstage-plugins/commit/a14869c3f4177049cb8d6552b36c3ffd17e7997d))

## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.8.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.8.0...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.8.1) (2024-06-04)

## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.8.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.7.2...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.8.0) (2024-05-22)

### Features

- **orchestrator:** add permissions to orchestrator plugin ([#1599](https://github.com/janus-idp/backstage-plugins/issues/1599)) ([d0a4531](https://github.com/janus-idp/backstage-plugins/commit/d0a453181e177eb1da7b1e231253b76a2d9356a8))

## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.7.2](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.7.1...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.7.2) (2024-05-15)

### Documentation

- **orchestrator:** removes instructions related to the editor ([#1664](https://github.com/janus-idp/backstage-plugins/issues/1664)) ([10a75b2](https://github.com/janus-idp/backstage-plugins/commit/10a75b2706c72751bd774d6fae4332bbc527dc2b))

## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.7.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.7.0...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.7.1) (2024-05-09)

## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.7.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.6.4...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.7.0) (2024-05-09)

### Features

- **orchestrator:** add ability to re-trigger workflow in error state ([#1624](https://github.com/janus-idp/backstage-plugins/issues/1624)) ([8709a37](https://github.com/janus-idp/backstage-plugins/commit/8709a37d08c2eafc22f10bd2a41f0a105768222d))

## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.6.4](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.6.3...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.6.4) (2024-04-18)

### Bug Fixes

- **orchestrator:** allows serving the editor envelope in disconnected environments ([#1450](https://github.com/janus-idp/backstage-plugins/issues/1450)) ([1e778d8](https://github.com/janus-idp/backstage-plugins/commit/1e778d88336dfec79d48ece4fd8d2a035133b70e))

## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.6.3](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.6.2...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.6.3) (2024-04-05)

## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.6.2](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.6.1...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.6.2) (2024-04-04)

### Bug Fixes

- **orchestrator:** add lastRunId to overview endpoints ([#1449](https://github.com/janus-idp/backstage-plugins/issues/1449)) ([cce56f7](https://github.com/janus-idp/backstage-plugins/commit/cce56f7de3acc41ecd30b1b9962d7817be69de7d))
- **orchestrator:** update devmode container tag ([#1439](https://github.com/janus-idp/backstage-plugins/issues/1439)) ([d59ad04](https://github.com/janus-idp/backstage-plugins/commit/d59ad044cd5d8d7566464f140cdbc1dfbad85a62))

## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.6.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.6.0...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.6.1) (2024-03-29)

### Bug Fixes

- **orchestrator:** fixes v2/instances endpoint ([#1414](https://github.com/janus-idp/backstage-plugins/issues/1414)) ([88b49df](https://github.com/janus-idp/backstage-plugins/commit/88b49df35cf10e231ba69c239e873cb10e7cc25b))

## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.6.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.5.1...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.6.0) (2024-03-14)

### Features

- **orchestrator:** verify availability and cache workflow definition IDs ([#1309](https://github.com/janus-idp/backstage-plugins/issues/1309)) ([4d322f1](https://github.com/janus-idp/backstage-plugins/commit/4d322f1fc5b6f8b1afedf40cfe1b24b2edae2ac1))

## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.5.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.5.0...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.5.1) (2024-03-12)

### Bug Fixes

- **orchestrator:** openapi files hash generation use nodejs script ([#1328](https://github.com/janus-idp/backstage-plugins/issues/1328)) ([e91c27e](https://github.com/janus-idp/backstage-plugins/commit/e91c27ecf7066149aa498e5b2e65a1d3653fa448))

## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.5.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.4.1...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.5.0) (2024-03-11)

### Features

- **orchestrator:** verify if auto-generated openapi files are up-to-date ([#1323](https://github.com/janus-idp/backstage-plugins/issues/1323)) ([650b435](https://github.com/janus-idp/backstage-plugins/commit/650b435ac53c517fc5e960734a4d3085399b1608))

## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.4.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.4.0...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.4.1) (2024-03-11)

### Bug Fixes

- **orchestrator:** add missing query parameter changes for /overview endpoint ([#1321](https://github.com/janus-idp/backstage-plugins/issues/1321)) ([241576d](https://github.com/janus-idp/backstage-plugins/commit/241576d242cd88e6d264180a69a5e1e9cd282df6))

### Other changes

- **orchestrator:** add unit tests for v2 endpoints ([#1300](https://github.com/janus-idp/backstage-plugins/issues/1300)) ([9a13138](https://github.com/janus-idp/backstage-plugins/commit/9a13138c61d3cc7331f739da80f020bb68dd61e5))

## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.4.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.3.7...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.4.0) (2024-03-07)

### Features

- **orchestrator:** support pagination for /instances and /overview ([#1313](https://github.com/janus-idp/backstage-plugins/issues/1313)) ([79d5988](https://github.com/janus-idp/backstage-plugins/commit/79d598816f16c8346b6868bff4cc30d695cad518))

## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.3.7](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.3.6...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.3.7) (2024-03-03)

### Bug Fixes

- **orchestrator:** stop fetching workflow URI ([#1297](https://github.com/janus-idp/backstage-plugins/issues/1297)) ([2456a28](https://github.com/janus-idp/backstage-plugins/commit/2456a287dbff955a0916b9600e89a39511cd537a))

## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.3.6](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.3.5...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.3.6) (2024-02-29)

### Bug Fixes

- **orchestrator:** refactor 500 response to use ErrorResponse object ([#1290](https://github.com/janus-idp/backstage-plugins/issues/1290)) ([2580f3d](https://github.com/janus-idp/backstage-plugins/commit/2580f3d38cecf78334964666eb7c127c21b00924))

## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.3.5](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.3.4...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.3.5) (2024-02-28)

### Bug Fixes

- **orchestrator:** clean up the plugin code ([#1292](https://github.com/janus-idp/backstage-plugins/issues/1292)) ([ad27fb8](https://github.com/janus-idp/backstage-plugins/commit/ad27fb8e98913a6b80feb38ff58a7864e1953a7e))

## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.3.4](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.3.3...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.3.4) (2024-02-28)

### Bug Fixes

- **orchestrator:** regenerate Open API with new instance state ([#1289](https://github.com/janus-idp/backstage-plugins/issues/1289)) ([8755fdd](https://github.com/janus-idp/backstage-plugins/commit/8755fdd04dac406a4a02bfd7823d0993a6edf0b3))

## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.3.3](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.3.2...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.3.3) (2024-02-28)

### Bug Fixes

- **orchestrator:** handle nullable start/state properties of process instance ([#1277](https://github.com/janus-idp/backstage-plugins/issues/1277)) ([d8a43a5](https://github.com/janus-idp/backstage-plugins/commit/d8a43a5a164f83fc90d037ae3d7a355f5de543e0))

## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.3.2](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.3.1...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.3.2) (2024-02-27)

### Bug Fixes

- **orchestrator:** remove date-time format from spec ([#1282](https://github.com/janus-idp/backstage-plugins/issues/1282)) ([2b59dcf](https://github.com/janus-idp/backstage-plugins/commit/2b59dcf00082e617911289d8813ad02b83800470))

## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.3.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.3.0...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.3.1) (2024-02-21)

### Bug Fixes

- **orchestrator:** implementation of getWorkflowById (v2) ([#1233](https://github.com/janus-idp/backstage-plugins/issues/1233)) ([f9f9008](https://github.com/janus-idp/backstage-plugins/commit/f9f9008d29f244c2ae6d688d3e2dc9b65b705e5b))
- **orchestrator:** minor improvements and fixes ([#1242](https://github.com/janus-idp/backstage-plugins/issues/1242)) ([c9ec4cb](https://github.com/janus-idp/backstage-plugins/commit/c9ec4cbe1847268e8068edc69c7937c5e133c315))

## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.3.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.2.1...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.3.0) (2024-02-20)

### Features

- **orchestrator:** add OpenAPI v2 implementations ([#1182](https://github.com/janus-idp/backstage-plugins/issues/1182)) ([43ac2f3](https://github.com/janus-idp/backstage-plugins/commit/43ac2f3f492b5c977142a3cfd9868d5e193ceb02))

### Bug Fixes

- **orchestrator:** decommission the ProcessInstance.lastUpdate field ([#1230](https://github.com/janus-idp/backstage-plugins/issues/1230)) ([9724e27](https://github.com/janus-idp/backstage-plugins/commit/9724e27eaa84fe73d7724f28c86409681b7f79f8))

## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.2.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.2.0...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.2.1) (2024-02-16)

### Bug Fixes

- **orchestrator:** resolve mismatch between execution data and composed schema ([#1217](https://github.com/janus-idp/backstage-plugins/issues/1217)) ([af85114](https://github.com/janus-idp/backstage-plugins/commit/af851148935e1ed083709cac145520d7551de737))

## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.2.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.1.0...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.2.0) (2024-02-16)

### Features

- **orchestrator:** add OpenAPI support ([#1123](https://github.com/janus-idp/backstage-plugins/issues/1123)) ([bd88e23](https://github.com/janus-idp/backstage-plugins/commit/bd88e2304c93761ce6754985074f004a5a3c8c4b))

## @red-hat-developer-hub/backstage-plugin-orchestrator-common [1.1.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.0.0...@red-hat-developer-hub/backstage-plugin-orchestrator-common@1.1.0) (2024-02-02)

### Features

- **orchestrator:** add the ability to rerun workflows in a new instance ([#1141](https://github.com/janus-idp/backstage-plugins/issues/1141)) ([fe326df](https://github.com/janus-idp/backstage-plugins/commit/fe326df569caa5a9e7b7ec809c1c371a2a936010))

## @red-hat-developer-hub/backstage-plugin-orchestrator-common 1.0.0 (2024-01-17)

### Features

- **orchestrator:** add orchestrator plugin ([#783](https://github.com/janus-idp/backstage-plugins/issues/783)) ([cf5fe74](https://github.com/janus-idp/backstage-plugins/commit/cf5fe74db6992d9f51f5073bbcf20c8c346357a1)), closes [#28](https://github.com/janus-idp/backstage-plugins/issues/28) [#38](https://github.com/janus-idp/backstage-plugins/issues/38) [#35](https://github.com/janus-idp/backstage-plugins/issues/35) [#21](https://github.com/janus-idp/backstage-plugins/issues/21)
