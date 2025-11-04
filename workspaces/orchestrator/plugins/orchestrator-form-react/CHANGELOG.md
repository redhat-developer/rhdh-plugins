### Dependencies

## 2.3.1

### Patch Changes

- 40e4267: Fixing endless onChange() loop and turning "ui:allowNewItems" from string to boolean type.

## 2.3.0

### Minor Changes

- fba1136: Backstage version bump to v1.44.1

### Patch Changes

- Updated dependencies [fba1136]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.2.0
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@2.3.0

## 2.2.0

### Minor Changes

- 149804f: Disable Next button when active widgets are fetching and processing data
  - Add isFetching state tracking to StepperContext using a counter to monitor multiple concurrent async operations
  - Update OrchestratorFormToolbar to disable Next button when isFetching is true (in addition to existing isValidating check)
  - Add handleFetchStarted and handleFetchEnded callbacks to OrchestratorFormContextProps to allow widgets to report their loading status
  - Update useFetchAndEvaluate to track complete loading state (fetch + template evaluation) and notify context
  - Create useProcessingState custom hook to reduce code duplication across widgets, providing a reusable pattern for tracking both fetch and processing states
  - Refactor SchemaUpdater, ActiveTextInput, ActiveDropdown, and ActiveMultiSelect to use useProcessingState hook
  - Track the complete loading lifecycle: fetch → process → ready, ensuring Next button is disabled until all async work completes
  - Prevents race conditions where Next button becomes enabled before widgets finish processing data

- 8b1ce63: Prune obsolete properties from form data before Review and Submit
  - Update `OrchestratorForm` to prune form data before passing to Review step and execution
  - Fixes issue where SchemaUpdater dynamically adds/removes fields but old values remain in form state
  - Ensures only properties that exist in the final schema version are displayed on Review page and submitted
  - Prevents stale data from previous schema versions from being included in workflow execution

### Patch Changes

- Updated dependencies [149804f]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@2.2.0

## 2.1.0

### Minor Changes

- de5ced6: Backstage version bump to v1.42.5

### Patch Changes

- Updated dependencies [de5ced6]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.1.0
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@2.1.0

## 2.0.6

### Patch Changes

- f0a427c: Added internationalization to the frontend plugins.
- Updated dependencies [f0a427c]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.0.6
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@2.0.6

## 2.0.5

### Patch Changes

- a4ae23c: Fixing validation of multi-step wizard when ui:order is used by supplying correct step fields.
- Updated dependencies [c79ffa7]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.0.5
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@2.0.5

## 2.0.4

### Patch Changes

- 2fbdb53: remove setting inputs as readonly when execute from nextWorkflows as this was part of deprecated assessment workflow type
- 8c95d55: Align with RHDH @backstage/core-components version and add table translation
- Updated dependencies [2fbdb53]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.0.4
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@2.0.4

## 2.0.3

### Patch Changes

- fac94ef: fix(orchestrator): on retrigger workflow, tokens requested by the AuthRequester are forwarded
- Updated dependencies [fac94ef]
- Updated dependencies [16439ad]
- Updated dependencies [4fd43f1]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.0.3
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@2.0.3

## 2.0.2

### Patch Changes

- 8d89f18: Remove default React imports.
- 10b01d4: Adding support for top-level 'ui:order' to arrange wizard steps.
- Updated dependencies [26e602a]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.0.2
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@2.0.2

## 2.0.1

### Patch Changes

- 651de2c: A wizard step is not rendered if it's properites are both empty and "ui:widget" is set to "hidden".
- Updated dependencies [32e0a44]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.0.1
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@2.0.1

## 2.0.0

### Major Changes

- 3fce49c: Update dependencies to macth Backstage 1.39.1

### Patch Changes

- Updated dependencies [784d858]
- Updated dependencies [3fce49c]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.0.0
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@2.0.0

## 1.6.6

### Patch Changes

- Updated dependencies [223d35c]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@2.0.1
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.6.6

## 1.6.5

### Patch Changes

- a79f849: Updated dependency `prettier` to `3.6.2`.
- 26bdbc7: Add support for ui:order field for Execution form
- Updated dependencies [a79f849]
- Updated dependencies [e590195]
- Updated dependencies [66b7b7c]
- Updated dependencies [d7d2490]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.6.5
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@2.0.0

## 1.6.4

### Patch Changes

- Updated dependencies [ff0f69e]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.28.4
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.6.4

## 1.6.3

### Patch Changes

- Updated dependencies [a3df181]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.28.3
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.6.3

## 1.6.2

### Patch Changes

- Updated dependencies [da78550]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.28.2
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.6.2

## 1.6.1

### Patch Changes

- Updated dependencies [a9a6095]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.28.1
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.6.1

## 1.6.0

### Minor Changes

- 53f3ffb: implemented authorization widget for enabling specifying the required auth providers in the schema so the UI can pick it up from there and forward to workflow execution

### Patch Changes

- Updated dependencies [53f3ffb]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.6.0
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.28.0

## 1.5.0

### Minor Changes

- 78e3ee6: Added backstage-plugin-orchestrator-form-widgets plugin hosting default set of RJSF form widgets provided along the Orchestrator. Includes the SchemaUpdater widget capable of downloading JSON schema chunks and modifying the RJSF form on the fly.
- fc9ce7c: Backstage version bump to v1.37.1

### Patch Changes

- 2f33284: Update kie-tools, @janus/cli and Backstage supported version to the most recent ones.
- a9e5f32: Updated dependency `@openapitools/openapi-generator-cli` to `2.20.0`.
  Updated dependency `prettier` to `3.5.3`.
  Updated dependency `@redhat-developer/red-hat-developer-hub-theme` to `0.5.1`.
  Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.6.0`.
  Updated dependency `@janus-idp/cli` to `3.5.0`.
- Updated dependencies [78e3ee6]
- Updated dependencies [2f33284]
- Updated dependencies [a9e5f32]
- Updated dependencies [fc9ce7c]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.5.0

## 1.4.6

### Patch Changes

- d59e940: Updated dependency `@openapitools/openapi-generator-cli` to `2.15.3`.
  Updated dependency `prettier` to `3.4.2`.
  Updated dependency `@janus-idp/cli` to `1.19.1`.
  Updated dependency `monaco-editor` to `0.52.2`.
  Updated dependency `monaco-yaml` to `5.2.3`.
  Updated dependency `sass` to `1.83.0`.
  Updated dependency `webpack` to `5.97.1`.
- d6e5b1a: fix margin in back button
- Updated dependencies [d59e940]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.4.3

## 1.4.5

### Patch Changes

- 35bb667: Fix alignment of key-values on the Review step of the Run Workflow.

## 1.4.4

### Patch Changes

- c301dbd: resolve rerendering form decorator on every change

## 1.4.3

### Patch Changes

- 54daa8c: Migrated from [janus-idp/backstage-plugins](https://github.com/janus-idp/backstage-plugins).
- Updated dependencies [54daa8c]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.4.2

## 1.4.2

### Patch Changes

- aee9d4a: Hotfix for button background - to share the one with theme.

## 1.4.1

### Patch Changes

- 0e6bfd3: feat: update Backstage to the latest version

  Update to Backstage 1.32.5

- 67f466a: Resolved the following issues:
  1. enabled validation using customValidate, and replaced extraErrors with getExtraErrors, since extraErrors is supposed to be populated when running onSubmit, and that isn't exposed to the user. Added busy handling while calling getExtraErrors.
  2. moved FormComponent to a separate component, to avoid buggy behavior and code smells with component generated in a different component.
  3. update formData on each change instead of when moving to next step, to avoid data being cleared.
  4. fix bug in validator - it only worked in first step, because of issue in @rjsf form
  5. removed unnecessary package json-schema that was used just for lint error, and fixed the root cause of lint error when importing types from @types/json-schema

- Updated dependencies [0e6bfd3]
- Updated dependencies [67f466a]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.4.1

## 1.4.0

### Minor Changes

- 8244f28: chore(deps): update to backstage 1.32

### Patch Changes

- Updated dependencies [8244f28]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.4.0

## 1.3.1

### Patch Changes

- 7342e9b: chore: remove @janus-idp/cli dep and relink local packages

  This update removes `@janus-idp/cli` from all plugins, as it’s no longer necessary. Additionally, packages are now correctly linked with a specified version.

## 1.3.0

### Minor Changes

- d9551ae: feat(deps): update to backstage 1.31

### Patch Changes

- d9551ae: Change local package references to a `*`
- d9551ae: upgrade to yarn v3
- Updated dependencies [d9551ae]
- Updated dependencies [d9551ae]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.3.0

* **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.21.0

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.20.0

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.19.0

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.18.2

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.18.1

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.18.0

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.17.3

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-form-api:** upgraded to 1.1.0

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.17.2

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.17.1

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.17.0

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.17.0

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.0.0
- **@red-hat-developer-hub/backstage-plugin-orchestrator-form-api:** upgraded to 1.0.0

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.16.0

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.15.2

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.15.1

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-common:** upgraded to 1.15.0

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-orchestrator-form-api:** upgraded to 1.0.1
