### Dependencies

## 2.5.0

### Minor Changes

- 5771568: Add dynamic conditional visibility for ui:hidden

  **Conditional Hiding Feature:**
  - Add `HiddenCondition` type supporting boolean and condition objects
  - Implement `evaluateHiddenCondition` utility for evaluating hide conditions
  - Support condition objects with `when`, `is`, `isNot`, and `isEmpty` operators
  - Support composite conditions with `allOf` (AND) and `anyOf` (OR) logic
  - Support nested field paths using dot notation (e.g., `config.server.port`)
  - Update `HiddenFieldTemplate` to dynamically evaluate hide conditions based on form data
  - Update `generateReviewTableData` to respect conditional hiding in review pages
  - Hidden field visibility updates in real-time when form data changes

  **Condition Object Patterns:**
  - `{ when: "field", is: "value" }` - Hide when field equals value
  - `{ when: "field", is: ["val1", "val2"] }` - Hide when field equals any value (OR)
  - `{ when: "field", isNot: "value" }` - Hide when field does NOT equal value
  - `{ when: "field", isEmpty: true }` - Hide when field is empty
  - `{ allOf: [...] }` - Hide when ALL conditions are true (AND)
  - `{ anyOf: [...] }` - Hide when ANY condition is true (OR)

  **Documentation:**
  - Update `orchestratorFormWidgets.md` with comprehensive examples of conditional hiding
  - Add examples for all condition patterns and composite conditions
  - Include complete real-world deployment configuration example

  **Testing:**
  - Add comprehensive unit tests for condition evaluation
  - Test simple conditions, composite conditions, and nested conditions
  - Test edge cases (empty values, nested paths)

- c35d07c: Add fetch:error:ignoreUnready and fetch:response:default options for form widgets

  **Feature 1: fetch:error:ignoreUnready**

  When using widgets with `fetch:retrigger` dependencies, the initial fetch often fails because dependent fields don't have values yet. This results in HTTP errors being displayed during initial load.
  - Add `fetch:error:ignoreUnready` option to suppress fetch error display until all `fetch:retrigger` dependencies have non-empty values
  - Errors are only suppressed when dependencies are empty; once filled, real errors are shown
  - Supported by: ActiveTextInput, ActiveDropdown, ActiveMultiSelect, SchemaUpdater

  **Feature 2: fetch:response:default**

  Widgets previously required `fetch:response:value` for defaults, meaning fetch must succeed. This adds static fallback defaults.
  - Add `fetch:response:default` option for static default values applied immediately on form initialization
  - Defaults are applied at form initialization level in `OrchestratorForm`, ensuring controlled components work correctly
  - Static defaults act as fallback when fetch fails, hasn't completed, or returns empty
  - Fetched values only override defaults when non-empty
  - Supported by: ActiveTextInput (string), ActiveDropdown (string), ActiveMultiSelect (string[])

  **Usage Examples:**

  ```json
  {
    "action": {
      "ui:widget": "ActiveTextInput",
      "ui:props": {
        "fetch:url": "...",
        "fetch:retrigger": ["current.appName"],
        "fetch:error:ignoreUnready": true,
        "fetch:response:default": "create"
      }
    }
  }
  ```

- 2be9dcc: Fix custom widgets not rendering in dependencies+oneOf (RHIDP-10952)

  **Widget Rendering Fix:**
  - Fix `generateUiSchema` to extract `ui:` properties from `dependencies` + `oneOf` branches
  - Custom widgets (ActiveTextInput, ActiveDropdown, etc.) now render correctly in conditional schemas
  - Resolves issue where widgets fell back to plain text inputs inside dependencies

  **Form Data Management:**
  - Update `pruneFormData` to correctly handle oneOf schemas with dependencies
  - Clean up stale form data when switching between oneOf options

### Patch Changes

- f030878: Fix validation errors incorrectly shown on wrong step when navigating back.

  When using widgets with `validate:url`, the `getExtraErrors` callback validates all fields across all steps and returns a nested error object. The previous logic had full error object when the current step had no errors, causing validation errors from other steps to appear on the wrong step.

  This fix:
  - Sets `extraErrors` to `undefined` when current step has no errors
  - Updates step navigation to only check current step's errors before proceeding

- 8524940: Fix TypeScript compilation errors in orchestrator plugins
- Updated dependencies [8524940]
- Updated dependencies [d91ef65]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.3.1
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@2.4.1

## 2.4.0

### Minor Changes

- 6db1430: Add ui:hidden property to hide fields while preserving functionality

  **Hidden Fields Feature:**
  - Add `ui:hidden` property to hide fields while preserving widget functionality
  - Implement `HiddenFieldTemplate` to render hidden fields with `display: none`
  - Hidden fields remain active, participate in validation, and are submitted with form data
  - Hidden fields are automatically excluded from the review page
  - Update `getSortedStepEntries` to filter out steps marked with `ui:hidden: true`
  - Automatically hide entire steps when all inputs within the step are hidden

  **Review Page Improvements:**
  - Add `NestedReviewTable` component for improved hierarchical display of nested objects
  - Update `generateReviewTableData` to skip hidden fields in review page
  - Update `generateReviewTableData` to skip entire steps when all fields are hidden
  - Simplified value rendering for better readability

  **Documentation:**
  - Update `orchestratorFormWidgets.md` with `ui:hidden` property documentation and usage examples

- 29dfed0: Backstage version bump to v1.45.2

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
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@2.4.0

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
