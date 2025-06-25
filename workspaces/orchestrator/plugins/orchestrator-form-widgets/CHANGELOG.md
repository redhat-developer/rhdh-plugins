# @red-hat-developer-hub/backstage-plugin-orchestrator-form-widgets

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
