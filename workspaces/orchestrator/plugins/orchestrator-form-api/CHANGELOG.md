# @red-hat-developer-hub/backstage-plugin-orchestrator-form-api

## 2.0.1

### Patch Changes

- Updated dependencies [32e0a44]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.0.1

## 2.0.0

### Major Changes

- 3fce49c: Update dependencies to macth Backstage 1.39.1

### Patch Changes

- Updated dependencies [784d858]
- Updated dependencies [3fce49c]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@3.0.0

## 1.6.6

### Patch Changes

- Updated dependencies [223d35c]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@2.0.1

## 1.6.5

### Patch Changes

- a79f849: Updated dependency `prettier` to `3.6.2`.
- Updated dependencies [e590195]
- Updated dependencies [66b7b7c]
- Updated dependencies [d7d2490]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@2.0.0

## 1.6.4

### Patch Changes

- Updated dependencies [ff0f69e]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.28.4

## 1.6.3

### Patch Changes

- Updated dependencies [a3df181]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.28.3

## 1.6.2

### Patch Changes

- Updated dependencies [da78550]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.28.2

## 1.6.1

### Patch Changes

- Updated dependencies [a9a6095]
  - @red-hat-developer-hub/backstage-plugin-orchestrator-common@1.28.1

## 1.6.0

### Minor Changes

- 53f3ffb: implemented authorization widget for enabling specifying the required auth providers in the schema so the UI can pick it up from there and forward to workflow execution

### Patch Changes

- Updated dependencies [53f3ffb]
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

## 1.4.3

### Patch Changes

- d59e940: Updated dependency `@openapitools/openapi-generator-cli` to `2.15.3`.
  Updated dependency `prettier` to `3.4.2`.
  Updated dependency `@janus-idp/cli` to `1.19.1`.
  Updated dependency `monaco-editor` to `0.52.2`.
  Updated dependency `monaco-yaml` to `5.2.3`.
  Updated dependency `sass` to `1.83.0`.
  Updated dependency `webpack` to `5.97.1`.

## 1.4.2

### Patch Changes

- 54daa8c: Migrated from [janus-idp/backstage-plugins](https://github.com/janus-idp/backstage-plugins).

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

## 1.4.0

### Minor Changes

- 8244f28: chore(deps): update to backstage 1.32

## 1.3.0

### Minor Changes

- d9551ae: feat(deps): update to backstage 1.31

### Patch Changes

- d9551ae: upgrade to yarn v3
