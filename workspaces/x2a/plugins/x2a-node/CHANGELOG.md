# @red-hat-developer-hub/backstage-plugin-x2a-node

## 0.3.0

### Minor Changes

- e887fb4: Added "Edit project" action.

### Patch Changes

- b32708f: Refactored callback token handling into a self-validating `CallbackToken` class that encapsulates generation, HMAC signing, and signature verification.
- f13f2c5: feat(x2a): Add `Rules` API

  This add a way to create into the init phase the x2a-rules introduced on x2a-convertor, and take advantage of the INPUT-AGENTS.md and EXPORT-AGENTS.md

  Summary of Changes:
  - New /rules/ api endpoints. (only admin can add it)
  - New Configmap on init phase.
  - Small changes on the script template.
  - New MCP tool to list all rules: x2a-list-rules (Also updated the project create)
  - Change on CSV to support rules.

- daaea27: Changed the project to be source-technology agnostic. Rephrasing all texts from being Chef-oriented to more generic variants. There is explicit mapping from free-form agentic findings to the new SourceTechnology enum (normalizeSourceTechnology.ts).
- 8d71b85: Removing Abbreviation from project's details. Replaced by project directory calculated from the project's name.
- Updated dependencies [e887fb4]
- Updated dependencies [f13f2c5]
- Updated dependencies [daaea27]
- Updated dependencies [8d71b85]
  - @red-hat-developer-hub/backstage-plugin-x2a-common@1.3.0

## 0.2.2

### Patch Changes

- f45644b: Internal change only - split x2a-node services.ts for better maintenance in the future.

## 0.2.1

### Patch Changes

- 484583b: Added x2a-list-modules MCP tool listing modules by projectId.

## 0.2.0

### Minor Changes

- ff39f9a: Add x2a-mcp-extras backend plugin exposing MCP tools for AI clients, x2a-dcr frontend plugin for RHDH 1.9 DCR OAuth consent flow, and x2a-node shared node-library. Refactor x2a-backend to use shared service refs from x2a-node via a feature loader.

### Patch Changes

- Updated dependencies [ff39f9a]
  - @red-hat-developer-hub/backstage-plugin-x2a-common@1.2.1
