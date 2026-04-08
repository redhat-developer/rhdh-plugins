# @red-hat-developer-hub/backstage-plugin-orchestrator-form-widgets

## 1.3.0

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

- 83ce2de: Add fetch:error:ignoreUnready and fetch:response:default options for form widgets

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

### Patch Changes

- aa0aed4: Allow ActiveDropdown fetch selectors to reference current form data via the combined response/current context.
- 5248cea: Allow ActiveDropdown fetch:response:default to be a JSONata selector evaluated against the fetch response.
- 135ca53: Show ActiveText spinner immediately on retrigger changes to avoid stale text during debounce. Add fetch:clearOnRetrigger to clear widget values when dependencies change.
- d3db579: Clarify ActiveText retrigger loading by showing a spinner while dependencies resolve.
- 9788861: Fixing endless onChange() loop and turning "ui:allowNewItems" from string to boolean type.
- 80b4f04: Add fetch:error:silent support to suppress fetch errors in widgets.
- 0584a97: Fix ActiveTextInput not clearing field when API returns empty string
- 8e6a28c: Fixed ActiveMultiSelect Enter key behavior when `ui:allowNewItems` is enabled. Pressing Enter now adds a new chip instead of submitting the form to the next step.
- 9649257: Evaluate JSONata expressions in fetch/validate request bodies on the client before sending.
- 054600c: Add fetch:skipInitialValue to keep fields empty until user input and treat empty-string defaults as valid.
- Updated dependencies [149804f]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@2.2.0

## 1.2.0

### Minor Changes

- e86bce0: Add markdown rendering support to ActiveText widget
  - Replace Typography component with MarkdownContent from @backstage/core-components
  - Support both static markdown content and dynamic template variables in markdown
  - Markdown features include headers, bold/italic text, lists, links, blockquotes, code blocks, and tables
  - Remove deprecated ui:variant prop as markdown provides its own styling through syntax
  - Update documentation to reflect markdown support and provide usage examples

### Patch Changes

- 4fa1356: In the active widgets, the default value received from an endpoint now replaces the actual value, unless the user has modified it.

## 1.1.0

### Minor Changes

- de5ced6: Backstage version bump to v1.42.5

### Patch Changes

- Updated dependencies [de5ced6]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.1.0
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@2.1.0

## 1.0.8

### Patch Changes

- e50b2b6: feat(orchestrator): The ActiveMultiSelect widget supports fetch:response:value selector for defaults
- fad61b7: ActiveTextInput ignores default value if it is null
- c2a1160: Add readonly option to the active widgets

## 1.0.7

### Patch Changes

- f370925: Fix ActiveDropdown for long lists.

## 1.0.6

### Patch Changes

- Updated dependencies [f0a427c]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.0.6
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@2.0.6

## 1.0.5

### Patch Changes

- Updated dependencies [c79ffa7]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.0.5
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@2.0.5

## 1.0.4

### Patch Changes

- 8c95d55: Align with RHDH @backstage/core-components version and add table translation
- Updated dependencies [2fbdb53]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.0.4
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@2.0.4

## 1.0.3

### Patch Changes

- fac94ef: fix(orchestrator): on retrigger workflow, tokens requested by the AuthRequester are forwarded
- Updated dependencies [fac94ef]
- Updated dependencies [16439ad]
- Updated dependencies [4fd43f1]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.0.3
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@2.0.3

## 1.0.2

### Patch Changes

- 8d89f18: Remove default React imports.
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@2.0.2

## 1.0.1

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@2.0.1

## 1.0.0

### Major Changes

- 3fce49c: Update dependencies to macth Backstage 1.39.1

### Patch Changes

- f897fea: If a fetch/validate body/headers field resolves to empty or undefined value, it is skipped from the HTTP request.
- Updated dependencies [3fce49c]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@2.0.0

## 0.2.10

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.6.6

## 0.2.9

### Patch Changes

- 7ce3fe0: Updated dependency `@mui/styles` to `5.18.0`.
- Updated dependencies [a79f849]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.6.5

## 0.2.8

### Patch Changes

- dd72e99: ActiveMultiSelect automatically builds an array from simple strings returned by jsonata selector.

## 0.2.7

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.6.4

## 0.2.6

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.6.3

## 0.2.5

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.6.2

## 0.2.4

### Patch Changes

- a034e5b: Pass bools and numbers as primitive values (not converted to strings).
- f5e85c5: Add support for selectors in SchemaUpdater. A complex response can be narrowed by the selector to produce the object structure as desired by the SchemaUpdater.
- 488852f: Fixing alignment of the ActiveMultiSelect widget's chips.
- b9be64b: Added "fetch:response:mandatory" selector for the ActiveMultiSelect widget.
- 112d44f: Adding suuport for template arrays for the Orchestrator widgets.
- 891844f: Template units can be evaluated to primitive values, complex objects and arrays.
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.6.1

## 0.2.3

### Patch Changes

- Updated dependencies [53f3ffb]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.6.0

## 0.2.2

### Patch Changes

- 72a99a5: Updated dependency `@mui/styles` to `5.17.1`.

## 0.2.1

### Patch Changes

- 3b571b3: Updated dependency `@janus-idp/cli` to `3.6.1`.

## 0.2.0

### Minor Changes

- 78e3ee6: Added backstage-plugin-orchestrator-form-widgets plugin hosting default set of RJSF form widgets provided along the Orchestrator. Includes the SchemaUpdater widget capable of downloading JSON schema chunks and modifying the RJSF form on the fly.

### Patch Changes

- 3370321: Setting up dev environment for the Orchestrator form widgets (dev-only HTTP server)
- a9e5f32: Updated dependency `@openapitools/openapi-generator-cli` to `2.20.0`.
  Updated dependency `prettier` to `3.5.3`.
  Updated dependency `@redhat-developer/red-hat-developer-hub-theme` to `0.5.1`.
  Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.6.0`.
  Updated dependency `@janus-idp/cli` to `3.5.0`.
- 103f0f4: Adding ActiveTextInput form widget
- Updated dependencies [78e3ee6]
- Updated dependencies [2f33284]
- Updated dependencies [a9e5f32]
- Updated dependencies [fc9ce7c]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-form-api@1.5.0
