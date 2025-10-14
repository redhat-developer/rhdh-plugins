### Dependencies

## 5.1.0

### Minor Changes

- de5ced6: Backstage version bump to v1.42.5

### Patch Changes

- Updated dependencies [de5ced6]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.1.0
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@2.1.0
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-react@2.1.0

## 5.0.9

### Patch Changes

- d3e9c60: Fix typo in useOrchestratorAuth when searching custom apis

## 5.0.8

### Patch Changes

- a24d93c: The AuthRequester widget can reference statically added non-core auth apis.
- 126f478: export orchestrator translation ref
- 23bb527: Simplify Workflow Instance page header based on customer feedback.

## 5.0.7

### Patch Changes

- cdf9bc0: fix typo in results card
- d87ba9e: ### Move components to `ui` folder:
  - BaseOrchestratorPage
  - InfoDialog
  - Selector
  - WorkflowInstanceStatusIndicator
  - WorkflowStatus

  ### Move components to `WorkflowInstancePage` folder:
  - Paragraph
  - WorkflowDescriptionModal
  - WorkflowRunDetails

  ### Move types to `types` folder:
  - WorkflowRunDetail

- f0a427c: Added internationalization to the frontend plugins.
- Updated dependencies [f0a427c]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-react@2.0.6
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.0.6
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@2.0.6

## 5.0.6

### Patch Changes

- 1a775a6: Fixes the CSP issues caused by integration with the kie-tools editor. We newly show just the workflow source code.
- df7e964: fix wrong color for selected tab
- 7d15bdf: UI fixes
- Updated dependencies [c79ffa7]
- Updated dependencies [a4ae23c]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.0.5
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-react@2.0.5
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@2.0.5

## 5.0.5

### Patch Changes

- 2fbdb53: remove setting inputs as readonly when execute from nextWorkflows as this was part of deprecated assessment workflow type
- 8c95d55: Align with RHDH @backstage/core-components version and add table translation
- f868d17: filter last run in wotkflows tab by entity
- Updated dependencies [2fbdb53]
- Updated dependencies [8c95d55]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-react@2.0.4
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.0.4
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@2.0.4

## 5.0.4

### Patch Changes

- fac94ef: fix(orchestrator): on retrigger workflow, tokens requested by the AuthRequester are forwarded
- 16439ad: A workflow can newly produce result values in the "markdown" format.
- Updated dependencies [fac94ef]
- Updated dependencies [16439ad]
- Updated dependencies [4fd43f1]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-react@2.0.3
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.0.3
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@2.0.3

## 5.0.3

### Patch Changes

- 843394c: updated frontend dynamic plugin configuration to include entity tab

## 5.0.2

### Patch Changes

- 26e602a: add workflows tab to catalog entities
- 8d89f18: Remove default React imports.
- Updated dependencies [26e602a]
- Updated dependencies [8d89f18]
- Updated dependencies [10b01d4]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.0.2
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-react@2.0.2
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@2.0.2

## 5.0.1

### Patch Changes

- 32e0a44: https://issues.redhat.com/browse/FLPATH-2493
- Updated dependencies [32e0a44]
- Updated dependencies [651de2c]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.0.1
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-react@2.0.1
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@2.0.1

## 5.0.0

### Major Changes

- 3fce49c: Update dependencies to macth Backstage 1.39.1

### Patch Changes

- Updated dependencies [784d858]
- Updated dependencies [3fce49c]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.0.0
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-react@2.0.0
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@2.0.0

## 4.0.1

### Patch Changes

- Updated dependencies [223d35c]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@2.0.1
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.6.6
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-react@1.6.6

## 4.0.0

### Major Changes

- 66b7b7c: removing assessment code

### Patch Changes

- a79f849: Updated dependency `prettier` to `3.6.2`.
- d7d2490: enable custom auth provider for executing workflows
- Updated dependencies [a79f849]
- Updated dependencies [e590195]
- Updated dependencies [66b7b7c]
- Updated dependencies [26bdbc7]
- Updated dependencies [d7d2490]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.6.5
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-react@1.6.5
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@2.0.0

## 3.1.4

### Patch Changes

- ff0f69e: update API - fetch executionSummary field
  Use execution summary for results card
- Updated dependencies [ff0f69e]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.28.4
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.6.4
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-react@1.6.4

## 3.1.3

### Patch Changes

- Updated dependencies [a3df181]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.28.3
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.6.3
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-react@1.6.3

## 3.1.2

### Patch Changes

- Updated dependencies [da78550]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.28.2
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.6.2
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-react@1.6.2

## 3.1.1

### Patch Changes

- 3dda068: fix CSS bugs for variables dialog and input schema dialog
- a9a6095: removing business key
- a9ab22e: fix search and filter for "running" and "failed"
- 18bda47: capitalize "Orchestrator" in path
- Updated dependencies [a9a6095]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.28.1
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.6.1
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-react@1.6.1

## 3.1.0

### Minor Changes

- 53f3ffb: implemented authorization widget for enabling specifying the required auth providers in the schema so the UI can pick it up from there and forward to workflow execution

### Patch Changes

- e337a39: fix isDarkMode to work in auto mode
- b6bfdb7: Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.9.0`.
- ce61d0a: "fix(orchestrator):remove workflow input editor"
- Updated dependencies [53f3ffb]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-react@1.6.0
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.6.0
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.28.0

## 3.0.4

### Patch Changes

- c02b521: match package versions with RHDH
- e5af42b: Use Code Snippet default colors in input schema dialog
- 1cf9f22: Use CodeSnippet default colors

## 3.0.3

### Patch Changes

- dc01428: enable retrigger
- 3b571b3: Updated dependency `@janus-idp/cli` to `3.6.1`.
- 95c8073: Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.8.0`.
- Updated dependencies [4ecd9f0]
- Updated dependencies [9bc8af0]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.27.3

## 3.0.2

### Patch Changes

- Updated dependencies [c6b54ad]
- Updated dependencies [7f6ca8a]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.27.2

## 3.0.1

### Patch Changes

- 56c160b: Add endpoind to ping workflow service
- Updated dependencies [56c160b]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.27.1

## 3.0.0

### Major Changes

- ff929e2: feat(orchestrator): capturing the auth tokens from available SCM systems after user logsIn and then send it to backend-plugin.

### Minor Changes

- 78e3ee6: Added backstage-plugin-orchestrator-form-widgets plugin hosting default set of RJSF form widgets provided along the Orchestrator. Includes the SchemaUpdater widget capable of downloading JSON schema chunks and modifying the RJSF form on the fly.
- fc9ce7c: Backstage version bump to v1.37.1

### Patch Changes

- 54c33db: change breadcrumbs titles
- 5214a15: Dev change only - use @janus-idp/cli 3.2.0 instead of 3.5.0
- 3ac726f: add workflow status (available/unavailable)
- 535f787: Add option to view input schema from workflows table
- 7ebb7e1: fix bug in workflowResult - values
- a6a0262: Fix Results card to render boolean values correctly.
- 2ab77e3: run again button text is running while workflow is running
- 2f33284: Update kie-tools, @janus/cli and Backstage supported version to the most recent ones.
- a9e5f32: Updated dependency `@openapitools/openapi-generator-cli` to `2.20.0`.
  Updated dependency `prettier` to `3.5.3`.
  Updated dependency `@redhat-developer/red-hat-developer-hub-theme` to `0.5.1`.
  Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.6.0`.
  Updated dependency `@janus-idp/cli` to `3.5.0`.
- 4842b37: Add status icons
- 438e3aa: Add aborted as a result to WorkflowResult
- 567adeb: fix use of 'xs' in grid.item
- 6eecbea: replace sonataflow editor with serverless-workflow-standalone-editor
- 04ca7f3: Add Workflow Status to WorkflowsTable
- Updated dependencies [78e3ee6]
- Updated dependencies [2f33284]
- Updated dependencies [a9e5f32]
- Updated dependencies [fc9ce7c]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-react@1.5.0
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.5.0
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.27.0

## 2.6.3

### Patch Changes

- c64c3a5: fix view variables screen
- 28c900b: fixing responsiveness of the WorkflowPage
- Updated dependencies [691fd23]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.26.2

## 2.6.2

### Patch Changes

- 78411e8: fix compile issue
- ec0400b: Disable abort when workflow execution does not exist
- 4b77c55: If a workflow is Completed but the DataIndex reports an error message anyway, the message is rendered as a warning to reduce user's confusion.
- 3422e48: Add LoginAsAdmin readme file
- 6ae40d9: implement filters
- Updated dependencies [29cf5fb]
- Updated dependencies [754a051]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.26.1

## 2.6.1

### Patch Changes

- 4f0a326: [rc9] MTA displays two statuses in results when failing with error
- 7032c17: Update the workflow details screen to match the latest Figma design
- dcfe477: [UI] Empty values section in Results pane should not be rendered

## 2.6.0

### Minor Changes

- 541d33d: Rearranging Workflow instance page to unify formatting and better visibility of results.

### Patch Changes

- 00f0cea: Improve abort
- cda86f1: improve details in workflow instance page details card
- bff51b6: Update Orchestrator icon - plugin
- 1e498d8: improve results card in workflow instance page
- 868b6d8: add "view variables" dialog
- fb5aafd: Standardise the page loading animation
- Updated dependencies [967c377]
- Updated dependencies [05a1ce0]
- Updated dependencies [816d8bc]
- Updated dependencies [c7de094]
- Updated dependencies [bee24dc]
- Updated dependencies [d4fa6bf]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.26.0

## 2.5.1

### Patch Changes

- a75cfff: improve workflow details card in workflow page
- 6a777cc: workflow name column values in workflow runs table should be a link to workflow page
- d8c6ed0: update workflow instance page
- d33a96e: Workflow progress panel should have a scroll
- cea6963: workflow runs list view - rename name column
- be7b8c9: "Add runs button"
- d59e940: Updated dependency `@openapitools/openapi-generator-cli` to `2.15.3`.
  Updated dependency `prettier` to `3.4.2`.
  Updated dependency `@janus-idp/cli` to `1.19.1`.
  Updated dependency `monaco-editor` to `0.52.2`.
  Updated dependency `monaco-yaml` to `5.2.3`.
  Updated dependency `sass` to `1.83.0`.
  Updated dependency `webpack` to `5.97.1`.
- cf1c024: bug fix in workflow runs table status filter
- 71fd546: Implement inputs card in workflow instance page
- 1d1d8cf: hide abort button when disabled
- 353e038: Workflows Table - rename tooltip "Run” instead of “Execute.”
- f3ace9e: add workflow tabs - details and runs
- Updated dependencies [d59e940]
- Updated dependencies [d6e5b1a]
- Updated dependencies [9cc8c89]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.25.1
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.4.3
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-react@1.4.6

## 2.5.0

### Minor Changes

- 5ab913b: Access can now be managed on a per-workflow basis.

### Patch Changes

- Updated dependencies [5b90f96]
- Updated dependencies [5ab913b]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.25.0

## 2.4.3

### Patch Changes

- f5bcd52: remove average duration from workflow table and overview page
- 6a71932: added export-dynamic scripts
- Updated dependencies [b6cf167]
- Updated dependencies [1d4cfa1]
- Updated dependencies [35bb667]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.24.3
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-react@1.4.5

## 2.4.2

### Patch Changes

- 8f32f1c: Configuration and documentation added to ease development setup
- bab8daa: The parent assessment link is shown again thanks to fixing passing of the businessKey when "execute" action is trigerred.
- Updated dependencies [9f61eb0]
- Updated dependencies [c301dbd]
- Updated dependencies [bab8daa]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.24.2
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-react@1.4.4

## 2.4.1

### Patch Changes

- 54daa8c: Migrated from [janus-idp/backstage-plugins](https://github.com/janus-idp/backstage-plugins).
- Updated dependencies [54daa8c]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.24.1
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.4.2
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-react@1.4.3

## 2.4.0

### Minor Changes

- 603a162: make error handling consistent in backend and UI

### Patch Changes

- 8a76b49: Makes very long workflow result messages still readable.
- b2a7181: Fix filtering by status on the Workflow Runs tab.
- Updated dependencies [aee9d4a]
- Updated dependencies [25f1787]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-react@1.4.2
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.24.0

## 2.3.2

### Patch Changes

- 76674da: Fixes issue when WorkflowResult panel fails on malformed provided result.

## 2.3.1

### Patch Changes

- 0e6bfd3: feat: update Backstage to the latest version

  Update to Backstage 1.32.5

- Updated dependencies [0e6bfd3]
- Updated dependencies [67f466a]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-react@1.4.1
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.4.1
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.23.1

## 2.3.0

### Minor Changes

- 8244f28: chore(deps): update to backstage 1.32

### Patch Changes

- Updated dependencies [8244f28]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-react@1.4.0
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.4.0
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.23.0

## 2.2.1

### Patch Changes

- 7342e9b: chore: remove @janus-idp/cli dep and relink local packages

  This update removes `@janus-idp/cli` from all plugins, as it’s no longer necessary. Additionally, packages are now correctly linked with a specified version.

- Updated dependencies [7342e9b]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-react@1.3.1

## 2.2.0

### Minor Changes

- d9551ae: feat(deps): update to backstage 1.31

### Patch Changes

- d9551ae: Change local package references to a `*`
- d9551ae: pin the @janus-idp/cli package
- d9551ae: upgrade to yarn v3
- Updated dependencies [d9551ae]
- Updated dependencies [d9551ae]
- Updated dependencies [d9551ae]
- Updated dependencies [d9551ae]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-react@1.3.0
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.22.0
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.3.0

* **@red-hat-developer-hub/backstage-plugin-orchestrator-form-react:** upgraded to 1.2.1

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.21.0
- **@red-hat-developer-hub/backstage-plugin-orchestrator-form-react:** upgraded to 1.2.0

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.21.0
- **@red-hat-developer-hub/backstage-plugin-orchestrator-form-api:** upgraded to 1.2.0
- **@red-hat-developer-hub/backstage-plugin-orchestrator-form-react:** upgraded to 1.2.0

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.20.0
- **@red-hat-developer-hub/backstage-plugin-orchestrator-form-react:** upgraded to 1.1.6
- **@janus-idp/cli:** upgraded to 1.15.2

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.19.0
- **@red-hat-developer-hub/backstage-plugin-orchestrator-form-react:** upgraded to 1.1.5

### Dependencies

- **@janus-idp/cli:** upgraded to 1.15.1

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.18.2
- **@red-hat-developer-hub/backstage-plugin-orchestrator-form-react:** upgraded to 1.1.4

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.18.1
- **@red-hat-developer-hub/backstage-plugin-orchestrator-form-react:** upgraded to 1.1.3

### Dependencies

- **@janus-idp/cli:** upgraded to 1.15.0

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.18.0
- **@red-hat-developer-hub/backstage-plugin-orchestrator-form-react:** upgraded to 1.1.2

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.17.3
- **@red-hat-developer-hub/backstage-plugin-orchestrator-form-react:** upgraded to 1.1.1

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-form-api:** upgraded to 1.1.0
- **@red-hat-developer-hub/backstage-plugin-orchestrator-form-react:** upgraded to 1.1.0
- **@janus-idp/cli:** upgraded to 1.14.0

### Dependencies

- **@janus-idp/cli:** upgraded to 1.13.2

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.17.2
- **@red-hat-developer-hub/backstage-plugin-orchestrator-form-react:** upgraded to 1.0.10

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.17.1
- **@red-hat-developer-hub/backstage-plugin-orchestrator-form-react:** upgraded to 1.0.9

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.17.0
- **@red-hat-developer-hub/backstage-plugin-orchestrator-form-react:** upgraded to 1.0.8

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.16.0
- **@red-hat-developer-hub/backstage-plugin-orchestrator-form-react:** upgraded to 1.0.6

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.15.2
- **@red-hat-developer-hub/backstage-plugin-orchestrator-form-react:** upgraded to 1.0.5

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-form-react:** upgraded to 1.0.4

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.15.1
- **@red-hat-developer-hub/backstage-plugin-orchestrator-form-react:** upgraded to 1.0.3

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.15.0
- **@red-hat-developer-hub/backstage-plugin-orchestrator-form-react:** upgraded to 1.0.2

### Dependencies

- **@janus-idp/cli:** upgraded to 1.13.1

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-form-api:** upgraded to 1.0.1
- **@red-hat-developer-hub/backstage-plugin-orchestrator-form-react:** upgraded to 1.0.1

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.14.0

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.18.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.18.0...@red-hat-developer-hub/backstage-plugin-orchestrator@1.18.1) (2024-08-02)

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.13.1

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.18.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.17.0...@red-hat-developer-hub/backstage-plugin-orchestrator@1.18.0) (2024-07-26)

### Features

- **deps:** update to backstage 1.29 ([#1900](https://github.com/janus-idp/backstage-plugins/issues/1900)) ([f53677f](https://github.com/janus-idp/backstage-plugins/commit/f53677fb02d6df43a9de98c43a9f101a6db76802))
- **orchestrator:** use v2 endpoints to retrieve instances ([#1956](https://github.com/janus-idp/backstage-plugins/issues/1956)) ([537502b](https://github.com/janus-idp/backstage-plugins/commit/537502b9d2ac13f2fb3f79188422d2c6e97f41fb))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.13.0

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.17.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.16.1...@red-hat-developer-hub/backstage-plugin-orchestrator@1.17.0) (2024-07-24)

### Features

- **deps:** update to backstage 1.28 ([#1891](https://github.com/janus-idp/backstage-plugins/issues/1891)) ([1ba1108](https://github.com/janus-idp/backstage-plugins/commit/1ba11088e0de60e90d138944267b83600dc446e5))
- **orchestrator:** use v2 endpoints to retrieve workflow overviews ([#1892](https://github.com/janus-idp/backstage-plugins/issues/1892)) ([cca1e53](https://github.com/janus-idp/backstage-plugins/commit/cca1e53bc6b3019b1c544f2f62bed8723ebf6130))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.12.0

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.16.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.16.0...@red-hat-developer-hub/backstage-plugin-orchestrator@1.16.1) (2024-07-11)

### Bug Fixes

- **orchestrator:** returned scrolling bars to instance page cards ([#1880](https://github.com/janus-idp/backstage-plugins/issues/1880)) ([08545da](https://github.com/janus-idp/backstage-plugins/commit/08545daabd02a7ba6f9f12dedf237afbff1cd67a))

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.16.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.15.0...@red-hat-developer-hub/backstage-plugin-orchestrator@1.16.0) (2024-06-28)

### Features

- **orchestrator:** remove unneeded orchestrator jira integration and endpoint ([#1833](https://github.com/janus-idp/backstage-plugins/issues/1833)) ([d2a76fd](https://github.com/janus-idp/backstage-plugins/commit/d2a76fd3db028f9774c821759bee5f38b7131c94))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.10.0

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.15.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.14.1...@red-hat-developer-hub/backstage-plugin-orchestrator@1.15.0) (2024-06-26)

### Features

- **orchestrator:** disable buttons based on permissions ([#1818](https://github.com/janus-idp/backstage-plugins/issues/1818)) ([36504b0](https://github.com/janus-idp/backstage-plugins/commit/36504b05d96dbbf0b2395dc6e5c155c21fa73bcd))

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.14.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.14.0...@red-hat-developer-hub/backstage-plugin-orchestrator@1.14.1) (2024-06-19)

### Bug Fixes

- **matomo:** add default export for new backend system ([#1822](https://github.com/janus-idp/backstage-plugins/issues/1822)) ([5e72920](https://github.com/janus-idp/backstage-plugins/commit/5e72920209589535d503bb28e77f54175a0bd946))

### Dependencies

- **@janus-idp/cli:** upgraded to 1.11.1

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.14.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.13.7...@red-hat-developer-hub/backstage-plugin-orchestrator@1.14.0) (2024-06-13)

### Features

- **deps:** update to backstage 1.27 ([#1683](https://github.com/janus-idp/backstage-plugins/issues/1683)) ([a14869c](https://github.com/janus-idp/backstage-plugins/commit/a14869c3f4177049cb8d6552b36c3ffd17e7997d))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.9.0
- **@janus-idp/cli:** upgraded to 1.11.0

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.13.7](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.13.6...@red-hat-developer-hub/backstage-plugin-orchestrator@1.13.7) (2024-06-13)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.10.1

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.13.6](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.13.5...@red-hat-developer-hub/backstage-plugin-orchestrator@1.13.6) (2024-06-05)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.10.0

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.13.5](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.13.4...@red-hat-developer-hub/backstage-plugin-orchestrator@1.13.5) (2024-06-04)

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.8.1

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.13.4](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.13.3...@red-hat-developer-hub/backstage-plugin-orchestrator@1.13.4) (2024-06-03)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.9.0

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.13.3](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.13.2...@red-hat-developer-hub/backstage-plugin-orchestrator@1.13.3) (2024-05-31)

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.13.2](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.13.1...@red-hat-developer-hub/backstage-plugin-orchestrator@1.13.2) (2024-05-29)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.8.10

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.13.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.13.0...@red-hat-developer-hub/backstage-plugin-orchestrator@1.13.1) (2024-05-29)

### Bug Fixes

- **orchestrator:** upgrade to mui v5 ([#1727](https://github.com/janus-idp/backstage-plugins/issues/1727)) ([8b935dc](https://github.com/janus-idp/backstage-plugins/commit/8b935dc3c85fbe4030564301820d946effa78426))

### Dependencies

- **@janus-idp/cli:** upgraded to 1.8.9

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.13.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.12.6...@red-hat-developer-hub/backstage-plugin-orchestrator@1.13.0) (2024-05-28)

### Features

- **orchestrator:** add permissions to orchestrator plugin ([#1599](https://github.com/janus-idp/backstage-plugins/issues/1599)) ([d0a4531](https://github.com/janus-idp/backstage-plugins/commit/d0a453181e177eb1da7b1e231253b76a2d9356a8))
- **orchestrator:** label a Workflow assessment result as recommended ([#1705](https://github.com/janus-idp/backstage-plugins/issues/1705)) ([7e24e86](https://github.com/janus-idp/backstage-plugins/commit/7e24e86eb3094fa00b22aa77f79fb0e04dbf86f7))

### Bug Fixes

- **deps:** update dependency monaco-editor to ^0.49.0 ([#1690](https://github.com/janus-idp/backstage-plugins/issues/1690)) ([34308a3](https://github.com/janus-idp/backstage-plugins/commit/34308a3ba669666ab2ddd61b2ac0073edd98f8ce))
- **orchestrator:** bump `rjsf` dependencies ([#1715](https://github.com/janus-idp/backstage-plugins/issues/1715)) ([ea31cdb](https://github.com/janus-idp/backstage-plugins/commit/ea31cdbd7cb0a8842119f6d5d5dbd689e31040aa))
- **orchestrator:** fix the common package reference version ([#1704](https://github.com/janus-idp/backstage-plugins/issues/1704)) ([942b2a3](https://github.com/janus-idp/backstage-plugins/commit/942b2a3b6eb29c0fe88f9c98dea581309d02fded))

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.12.6](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.12.5...@red-hat-developer-hub/backstage-plugin-orchestrator@1.12.6) (2024-05-21)

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.12.5](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.12.4...@red-hat-developer-hub/backstage-plugin-orchestrator@1.12.5) (2024-05-20)

### Bug Fixes

- **orchestrator:** fixes many security-related issues ([#1681](https://github.com/janus-idp/backstage-plugins/issues/1681)) ([3e801c8](https://github.com/janus-idp/backstage-plugins/commit/3e801c84015f925bdecd226a161ef81a5fc69432))

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.12.4](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.12.3...@red-hat-developer-hub/backstage-plugin-orchestrator@1.12.4) (2024-05-16)

### Bug Fixes

- **orchestrator:** remove the need of react dev dependencies ([#1650](https://github.com/janus-idp/backstage-plugins/issues/1650)) ([5e60875](https://github.com/janus-idp/backstage-plugins/commit/5e60875932b906fd40e282d53b277a0f29efc67f))

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.12.3](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.12.2...@red-hat-developer-hub/backstage-plugin-orchestrator@1.12.3) (2024-05-16)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.8.7

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.12.2](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.12.1...@red-hat-developer-hub/backstage-plugin-orchestrator@1.12.2) (2024-05-15)

### Documentation

- **orchestrator:** removes instructions related to the editor ([#1664](https://github.com/janus-idp/backstage-plugins/issues/1664)) ([10a75b2](https://github.com/janus-idp/backstage-plugins/commit/10a75b2706c72751bd774d6fae4332bbc527dc2b))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.7.2

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.12.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.12.0...@red-hat-developer-hub/backstage-plugin-orchestrator@1.12.1) (2024-05-15)

### Bug Fixes

- **orchestrator:** export the `OrchestratorPlugin` accordingly ([#1644](https://github.com/janus-idp/backstage-plugins/issues/1644)) ([4a9d1f8](https://github.com/janus-idp/backstage-plugins/commit/4a9d1f821a30437e73631fac98b1aabc65473fba))

### Other changes

- **orchestrator:** add OrchestratorClient unit tests ([#1640](https://github.com/janus-idp/backstage-plugins/issues/1640)) ([2a2dc55](https://github.com/janus-idp/backstage-plugins/commit/2a2dc5581aa04b20bdf973ecb8310d179d6fd1a5))

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.12.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.11.2...@red-hat-developer-hub/backstage-plugin-orchestrator@1.12.0) (2024-05-14)

### Features

- **deps:** use RHDH themes in the backstage app and dev pages ([#1480](https://github.com/janus-idp/backstage-plugins/issues/1480)) ([8263bf0](https://github.com/janus-idp/backstage-plugins/commit/8263bf099736cbb0d0f2316082d338ba81fa6927))

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.11.2](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.11.1...@red-hat-developer-hub/backstage-plugin-orchestrator@1.11.2) (2024-05-13)

### Bug Fixes

- **orchestrator:** typos mentioning OpenShift ([#1639](https://github.com/janus-idp/backstage-plugins/issues/1639)) ([7ff4c75](https://github.com/janus-idp/backstage-plugins/commit/7ff4c754f73681e1a596d56721972af8872f3211))

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.11.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.11.0...@red-hat-developer-hub/backstage-plugin-orchestrator@1.11.1) (2024-05-09)

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.7.1
- **@janus-idp/cli:** upgraded to 1.8.6

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.11.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.10.6...@red-hat-developer-hub/backstage-plugin-orchestrator@1.11.0) (2024-05-09)

### Features

- **orchestrator:** add ability to re-trigger workflow in error state ([#1624](https://github.com/janus-idp/backstage-plugins/issues/1624)) ([8709a37](https://github.com/janus-idp/backstage-plugins/commit/8709a37d08c2eafc22f10bd2a41f0a105768222d))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.7.0

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.10.6](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.10.5...@red-hat-developer-hub/backstage-plugin-orchestrator@1.10.6) (2024-05-06)

### Bug Fixes

- **orchestrator:** disabled MUI table thirdSortClick ([#1614](https://github.com/janus-idp/backstage-plugins/issues/1614)) ([5e541bd](https://github.com/janus-idp/backstage-plugins/commit/5e541bd217500c83bd8d9eb94cf060805ef4b8a9))

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.10.5](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.10.4...@red-hat-developer-hub/backstage-plugin-orchestrator@1.10.5) (2024-05-02)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.8.5

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.10.4](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.10.3...@red-hat-developer-hub/backstage-plugin-orchestrator@1.10.4) (2024-05-02)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.8.4

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.10.3](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.10.2...@red-hat-developer-hub/backstage-plugin-orchestrator@1.10.3) (2024-05-02)

### Bug Fixes

- **orchestrator:** disable sorting ID column in workflow runs table ([#1595](https://github.com/janus-idp/backstage-plugins/issues/1595)) ([4d4875e](https://github.com/janus-idp/backstage-plugins/commit/4d4875eb4f91a3a3464b1ecbdcf647e9f1b84be5))

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.10.2](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.10.1...@red-hat-developer-hub/backstage-plugin-orchestrator@1.10.2) (2024-04-30)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.8.3

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.10.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.10.0...@red-hat-developer-hub/backstage-plugin-orchestrator@1.10.1) (2024-04-30)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.8.2

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.10.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.9.4...@red-hat-developer-hub/backstage-plugin-orchestrator@1.10.0) (2024-04-25)

### Features

- **orchestrator:** add endpoint to retrigger workflow in error state ([#1343](https://github.com/janus-idp/backstage-plugins/issues/1343)) ([328d23a](https://github.com/janus-idp/backstage-plugins/commit/328d23a7992da125becc8d7775a4ebd68165f243))

### Dependencies

- **@janus-idp/cli:** upgraded to 1.8.1

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.9.4](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.9.3...@red-hat-developer-hub/backstage-plugin-orchestrator@1.9.4) (2024-04-18)

### Bug Fixes

- **orchestrator:** allows serving the editor envelope in disconnected environments ([#1450](https://github.com/janus-idp/backstage-plugins/issues/1450)) ([1e778d8](https://github.com/janus-idp/backstage-plugins/commit/1e778d88336dfec79d48ece4fd8d2a035133b70e))

### Documentation

- **orchestrator:** fix quick start urls to private repo and make image urls raw ([#1521](https://github.com/janus-idp/backstage-plugins/issues/1521)) ([eefd264](https://github.com/janus-idp/backstage-plugins/commit/eefd2642b0dd3a2d6eb26eaf229c97a280adf07c))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.6.4

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.9.3](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.9.2...@red-hat-developer-hub/backstage-plugin-orchestrator@1.9.3) (2024-04-16)

### Bug Fixes

- fix typo in orchestrator documentation ([#1508](https://github.com/janus-idp/backstage-plugins/issues/1508)) ([bfa360a](https://github.com/janus-idp/backstage-plugins/commit/bfa360af97b5daf1902c267cd682e51cb6d71c83))

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.9.2](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.9.1...@red-hat-developer-hub/backstage-plugin-orchestrator@1.9.2) (2024-04-15)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.8.0

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.9.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.9.0...@red-hat-developer-hub/backstage-plugin-orchestrator@1.9.1) (2024-04-15)

### Documentation

- **orchestrator:** add a quickstart for users ([#1499](https://github.com/janus-idp/backstage-plugins/issues/1499)) ([28fe8da](https://github.com/janus-idp/backstage-plugins/commit/28fe8da644350facb4c414f1bd5ff48ba4801b24))

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.9.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.8.9...@red-hat-developer-hub/backstage-plugin-orchestrator@1.9.0) (2024-04-10)

### Features

- **orchestrator:** make workflow last run status as link to the workflow last run details page ([#1488](https://github.com/janus-idp/backstage-plugins/issues/1488)) ([fc2f94e](https://github.com/janus-idp/backstage-plugins/commit/fc2f94ed4ff2cb0795ba3b65eeea57eae3a8640c))

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.8.9](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.8.8...@red-hat-developer-hub/backstage-plugin-orchestrator@1.8.9) (2024-04-09)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.7.10

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.8.8](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.8.7...@red-hat-developer-hub/backstage-plugin-orchestrator@1.8.8) (2024-04-09)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.7.9

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.8.7](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.8.6...@red-hat-developer-hub/backstage-plugin-orchestrator@1.8.7) (2024-04-05)

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.6.3
- **@janus-idp/cli:** upgraded to 1.7.8

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.8.6](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.8.5...@red-hat-developer-hub/backstage-plugin-orchestrator@1.8.6) (2024-04-04)

### Documentation

- **orchestrator:** add OpenAPI doc ([#1441](https://github.com/janus-idp/backstage-plugins/issues/1441)) ([f6275e2](https://github.com/janus-idp/backstage-plugins/commit/f6275e2b37f467e65c267f951db8c413a69eb923))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.6.2

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.8.5](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.8.4...@red-hat-developer-hub/backstage-plugin-orchestrator@1.8.5) (2024-04-02)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.7.7

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.8.4](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.8.3...@red-hat-developer-hub/backstage-plugin-orchestrator@1.8.4) (2024-03-29)

### Bug Fixes

- **orchestrator:** fixes v2/instances endpoint ([#1414](https://github.com/janus-idp/backstage-plugins/issues/1414)) ([88b49df](https://github.com/janus-idp/backstage-plugins/commit/88b49df35cf10e231ba69c239e873cb10e7cc25b))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.6.1
- **@janus-idp/cli:** upgraded to 1.7.6

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.8.3](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.8.2...@red-hat-developer-hub/backstage-plugin-orchestrator@1.8.3) (2024-03-26)

### Bug Fixes

- **orchestrator:** remove error on Reset workflow ([#1393](https://github.com/janus-idp/backstage-plugins/issues/1393)) ([6ce210d](https://github.com/janus-idp/backstage-plugins/commit/6ce210dfb3ac82a887985057ea234cf8b6065068))

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.8.2](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.8.1...@red-hat-developer-hub/backstage-plugin-orchestrator@1.8.2) (2024-03-17)

### Bug Fixes

- **orchestrator:** fix dropdown look ([#1344](https://github.com/janus-idp/backstage-plugins/issues/1344)) ([9284299](https://github.com/janus-idp/backstage-plugins/commit/9284299710f4d498deb098a94a2be57e6d7516a6))

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.8.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.8.0...@red-hat-developer-hub/backstage-plugin-orchestrator@1.8.1) (2024-03-14)

### Bug Fixes

- **orchestrator:** update the installation instructions ([#1336](https://github.com/janus-idp/backstage-plugins/issues/1336)) ([d77e388](https://github.com/janus-idp/backstage-plugins/commit/d77e3887ee838a0d4ce075ab976203f13f2037c8))

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.8.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.7.8...@red-hat-developer-hub/backstage-plugin-orchestrator@1.8.0) (2024-03-14)

### Features

- **orchestrator:** verify availability and cache workflow definition IDs ([#1309](https://github.com/janus-idp/backstage-plugins/issues/1309)) ([4d322f1](https://github.com/janus-idp/backstage-plugins/commit/4d322f1fc5b6f8b1afedf40cfe1b24b2edae2ac1))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.6.0

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.7.8](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.7.7...@red-hat-developer-hub/backstage-plugin-orchestrator@1.7.8) (2024-03-12)

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.5.1

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.7.7](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.7.6...@red-hat-developer-hub/backstage-plugin-orchestrator@1.7.7) (2024-03-11)

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.5.0

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.7.6](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.7.5...@red-hat-developer-hub/backstage-plugin-orchestrator@1.7.6) (2024-03-11)

### Other changes

- **orchestrator:** add unit tests for v2 endpoints ([#1300](https://github.com/janus-idp/backstage-plugins/issues/1300)) ([9a13138](https://github.com/janus-idp/backstage-plugins/commit/9a13138c61d3cc7331f739da80f020bb68dd61e5))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.4.1

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.7.5](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.7.4...@red-hat-developer-hub/backstage-plugin-orchestrator@1.7.5) (2024-03-07)

### Bug Fixes

- **orchestraotr:** resolved grey background appears in actions column in workflows table ([#1317](https://github.com/janus-idp/backstage-plugins/issues/1317)) ([cd7b4e7](https://github.com/janus-idp/backstage-plugins/commit/cd7b4e7267c804c75b4bccf927b48c32f7943ed6))

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.7.4](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.7.3...@red-hat-developer-hub/backstage-plugin-orchestrator@1.7.4) (2024-03-07)

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.4.0

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.7.3](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.7.2...@red-hat-developer-hub/backstage-plugin-orchestrator@1.7.3) (2024-03-07)

### Bug Fixes

- **orchestrator:** fix abort button and rerun button disable issue ([#1311](https://github.com/janus-idp/backstage-plugins/issues/1311)) ([0c98279](https://github.com/janus-idp/backstage-plugins/commit/0c982798872f2cb1a3b9fef7ab15850474cb03a7))

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.7.2](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.7.1...@red-hat-developer-hub/backstage-plugin-orchestrator@1.7.2) (2024-03-04)

### Bug Fixes

- **orchestrator:** walk around the state field is empty issue when fetch instance ([#1299](https://github.com/janus-idp/backstage-plugins/issues/1299)) ([e5c33c0](https://github.com/janus-idp/backstage-plugins/commit/e5c33c06fc66a6ff393365282f825c5fdc4713c9))

### Dependencies

- **@janus-idp/cli:** upgraded to 1.7.5

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.7.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.7.0...@red-hat-developer-hub/backstage-plugin-orchestrator@1.7.1) (2024-03-03)

### Bug Fixes

- **orchestrator:** stop fetching workflow URI ([#1297](https://github.com/janus-idp/backstage-plugins/issues/1297)) ([2456a28](https://github.com/janus-idp/backstage-plugins/commit/2456a287dbff955a0916b9600e89a39511cd537a))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.3.7

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.7.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.6.7...@red-hat-developer-hub/backstage-plugin-orchestrator@1.7.0) (2024-03-03)

### Features

- **orchestrator:** display a description modal before triggering infra-wfs that resulted from an assessment wf ([#1284](https://github.com/janus-idp/backstage-plugins/issues/1284)) ([ec293c9](https://github.com/janus-idp/backstage-plugins/commit/ec293c9e79efd77873e17d07b1511ad9fdda8842))

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.6.7](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.6.6...@red-hat-developer-hub/backstage-plugin-orchestrator@1.6.7) (2024-02-29)

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.3.6

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.6.6](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.6.5...@red-hat-developer-hub/backstage-plugin-orchestrator@1.6.6) (2024-02-28)

### Bug Fixes

- **orchestrator:** clean up the plugin code ([#1292](https://github.com/janus-idp/backstage-plugins/issues/1292)) ([ad27fb8](https://github.com/janus-idp/backstage-plugins/commit/ad27fb8e98913a6b80feb38ff58a7864e1953a7e))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.3.5

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.6.5](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.6.4...@red-hat-developer-hub/backstage-plugin-orchestrator@1.6.5) (2024-02-28)

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.3.4

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.6.4](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.6.3...@red-hat-developer-hub/backstage-plugin-orchestrator@1.6.4) (2024-02-28)

### Bug Fixes

- **orchestrator:** handle nullable start/state properties of process instance ([#1277](https://github.com/janus-idp/backstage-plugins/issues/1277)) ([d8a43a5](https://github.com/janus-idp/backstage-plugins/commit/d8a43a5a164f83fc90d037ae3d7a355f5de543e0))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.3.3

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.6.3](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.6.2...@red-hat-developer-hub/backstage-plugin-orchestrator@1.6.3) (2024-02-27)

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.3.2

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.6.2](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.6.1...@red-hat-developer-hub/backstage-plugin-orchestrator@1.6.2) (2024-02-27)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.7.4

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.6.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.6.0...@red-hat-developer-hub/backstage-plugin-orchestrator@1.6.1) (2024-02-26)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.7.3

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.6.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.5.2...@red-hat-developer-hub/backstage-plugin-orchestrator@1.6.0) (2024-02-22)

### Features

- **orchestrator:** display a alert dialog when the user fails to abort a running workflow ([#1239](https://github.com/janus-idp/backstage-plugins/issues/1239)) ([44cb11b](https://github.com/janus-idp/backstage-plugins/commit/44cb11b80739f772f4caa4c2834287eec162b826))

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.5.2](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.5.1...@red-hat-developer-hub/backstage-plugin-orchestrator@1.5.2) (2024-02-21)

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.3.1
- **@janus-idp/cli:** upgraded to 1.7.2

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.5.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.5.0...@red-hat-developer-hub/backstage-plugin-orchestrator@1.5.1) (2024-02-20)

### Bug Fixes

- **orchestrator:** decommission the ProcessInstance.lastUpdate field ([#1230](https://github.com/janus-idp/backstage-plugins/issues/1230)) ([9724e27](https://github.com/janus-idp/backstage-plugins/commit/9724e27eaa84fe73d7724f28c86409681b7f79f8))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.3.0

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.5.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.4.3...@red-hat-developer-hub/backstage-plugin-orchestrator@1.5.0) (2024-02-18)

### Features

- **orchestrator:** display a confirmation dialog before the user aborts a running workflow ([#1215](https://github.com/janus-idp/backstage-plugins/issues/1215)) ([1453cf8](https://github.com/janus-idp/backstage-plugins/commit/1453cf8d42b14372c1a5c1973510450d24ae4b5a))

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.4.3](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.4.2...@red-hat-developer-hub/backstage-plugin-orchestrator@1.4.3) (2024-02-16)

### Bug Fixes

- **orchestrator:** resolve mismatch between execution data and composed schema ([#1217](https://github.com/janus-idp/backstage-plugins/issues/1217)) ([af85114](https://github.com/janus-idp/backstage-plugins/commit/af851148935e1ed083709cac145520d7551de737))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.2.1

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.4.2](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.4.1...@red-hat-developer-hub/backstage-plugin-orchestrator@1.4.2) (2024-02-16)

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.2.0

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.4.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.4.0...@red-hat-developer-hub/backstage-plugin-orchestrator@1.4.1) (2024-02-14)

### Bug Fixes

- **orchestrator:** the instance details card content is cropped ([#1196](https://github.com/janus-idp/backstage-plugins/issues/1196)) ([eb45070](https://github.com/janus-idp/backstage-plugins/commit/eb450709e8e34972386f4e34ee842208e323a3fb))

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.4.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.3.3...@red-hat-developer-hub/backstage-plugin-orchestrator@1.4.0) (2024-02-12)

### Features

- build Information dialog component to show confirmation or alert ([#1176](https://github.com/janus-idp/backstage-plugins/issues/1176)) ([ee8cc1d](https://github.com/janus-idp/backstage-plugins/commit/ee8cc1dad2f10d698b8fb7e19ef0f9abe3b6c6c7))

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.3.3](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.3.2...@red-hat-developer-hub/backstage-plugin-orchestrator@1.3.3) (2024-02-08)

### Bug Fixes

- **orchestrator:** resolve inconsistency with workflow run average duration format ([#1191](https://github.com/janus-idp/backstage-plugins/issues/1191)) ([0d82e90](https://github.com/janus-idp/backstage-plugins/commit/0d82e90a15fc8e90a4855188586986235394e3d3))

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.3.2](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.3.1...@red-hat-developer-hub/backstage-plugin-orchestrator@1.3.2) (2024-02-07)

### Bug Fixes

- **orchestrator:** removes the divider from the workflow definition card ([#1181](https://github.com/janus-idp/backstage-plugins/issues/1181)) ([c2fe940](https://github.com/janus-idp/backstage-plugins/commit/c2fe940fa395842c705f1371872791fdbd77095c))

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.3.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.3.0...@red-hat-developer-hub/backstage-plugin-orchestrator@1.3.1) (2024-02-05)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.7.1

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.3.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.2.0...@red-hat-developer-hub/backstage-plugin-orchestrator@1.3.0) (2024-02-02)

### Features

- **orchestrator:** add the ability to rerun workflows in a new instance ([#1141](https://github.com/janus-idp/backstage-plugins/issues/1141)) ([fe326df](https://github.com/janus-idp/backstage-plugins/commit/fe326df569caa5a9e7b7ec809c1c371a2a936010))

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.1.0

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.2.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.1.3...@red-hat-developer-hub/backstage-plugin-orchestrator@1.2.0) (2024-01-30)

### Features

- add new backend system support for existing backend plugins that have not been migrated over yet ([#1132](https://github.com/janus-idp/backstage-plugins/issues/1132)) ([06e16fd](https://github.com/janus-idp/backstage-plugins/commit/06e16fdcf64257dd08297cb727445d9a8a23c522))

### Dependencies

- **@janus-idp/cli:** upgraded to 1.7.0

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.1.3](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.1.2...@red-hat-developer-hub/backstage-plugin-orchestrator@1.1.3) (2024-01-30)

### Bug Fixes

- **orchestrator:** resolve bug in workflow instance page assessed by link ([#1142](https://github.com/janus-idp/backstage-plugins/issues/1142)) ([48724f8](https://github.com/janus-idp/backstage-plugins/commit/48724f8d90ec9927ed07382061bce78171ccb1b2))

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.1.2](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.1.1...@red-hat-developer-hub/backstage-plugin-orchestrator@1.1.2) (2024-01-29)

### Bug Fixes

- **orchestrator:** fixes sorting by name in the workflows list ([#1135](https://github.com/janus-idp/backstage-plugins/issues/1135)) ([2a023e1](https://github.com/janus-idp/backstage-plugins/commit/2a023e156a69ca3cf102ba9a77f076e3289b60b4))
- **orchestrator:** fixes sorting workflow runs ([#1136](https://github.com/janus-idp/backstage-plugins/issues/1136)) ([7c3d0f6](https://github.com/janus-idp/backstage-plugins/commit/7c3d0f62abf861faae82d84cf1d25213d1791dc5))

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.1.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.1.0...@red-hat-developer-hub/backstage-plugin-orchestrator@1.1.1) (2024-01-25)

### Bug Fixes

- **orchestrator:** set default workflow runs table size to 20 ([#1127](https://github.com/janus-idp/backstage-plugins/issues/1127)) ([c5e14fd](https://github.com/janus-idp/backstage-plugins/commit/c5e14fd8e343df7d8c6db7f539fbbd2747e7792e))

### Documentation

- **orchestrator:** adds a section about deploying as a dynamic plugins ([#1125](https://github.com/janus-idp/backstage-plugins/issues/1125)) ([eaff621](https://github.com/janus-idp/backstage-plugins/commit/eaff621cf39ab76909446616230de48512714187))

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.1.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.0.2...@red-hat-developer-hub/backstage-plugin-orchestrator@1.1.0) (2024-01-25)

### Features

- **orchestrator:** add auto refresh to workflow instance list and details pages ([#1081](https://github.com/janus-idp/backstage-plugins/issues/1081)) ([fc30645](https://github.com/janus-idp/backstage-plugins/commit/fc30645ff740e914708a20f1fa1e2e118f771433))

### Dependencies

- **@janus-idp/cli:** upgraded to 1.6.0

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.0.2](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.0.1...@red-hat-developer-hub/backstage-plugin-orchestrator@1.0.2) (2024-01-24)

### Bug Fixes

- **orchestrator:** do not show duration when ProcessInstance.end time is n/a ([#1112](https://github.com/janus-idp/backstage-plugins/issues/1112)) ([75e6bbe](https://github.com/janus-idp/backstage-plugins/commit/75e6bbe8737742494817112b8da0fc50be5ff245))

## @red-hat-developer-hub/backstage-plugin-orchestrator [1.0.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-orchestrator@1.0.0...@red-hat-developer-hub/backstage-plugin-orchestrator@1.0.1) (2024-01-18)

### Bug Fixes

- **orchestrator:** update the navigation bar icon according to UX ([#1078](https://github.com/janus-idp/backstage-plugins/issues/1078)) ([da3d8fc](https://github.com/janus-idp/backstage-plugins/commit/da3d8fc7a33f01729ead1d515d16ebefc47326c3))

## @red-hat-developer-hub/backstage-plugin-orchestrator 1.0.0 (2024-01-17)

### Features

- **orchestrator:** add orchestrator plugin ([#783](https://github.com/janus-idp/backstage-plugins/issues/783)) ([cf5fe74](https://github.com/janus-idp/backstage-plugins/commit/cf5fe74db6992d9f51f5073bbcf20c8c346357a1)), closes [#28](https://github.com/janus-idp/backstage-plugins/issues/28) [#38](https://github.com/janus-idp/backstage-plugins/issues/38) [#35](https://github.com/janus-idp/backstage-plugins/issues/35) [#21](https://github.com/janus-idp/backstage-plugins/issues/21)

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.0.0
