# @red-hat-developer-hub/backstage-plugin-scaffolder-backend-module-x2a

## 0.4.0

### Minor Changes

- f13f2c5: feat(x2a): Add `Rules` API

  This add a way to create into the init phase the x2a-rules introduced on x2a-convertor, and take advantage of the INPUT-AGENTS.md and EXPORT-AGENTS.md

  Summary of Changes:
  - New /rules/ api endpoints. (only admin can add it)
  - New Configmap on init phase.
  - Small changes on the script template.
  - New MCP tool to list all rules: x2a-list-rules (Also updated the project create)
  - Change on CSV to support rules.

### Patch Changes

- daaea27: Changed the project to be source-technology agnostic. Rephrasing all texts from being Chef-oriented to more generic variants. There is explicit mapping from free-form agentic findings to the new SourceTechnology enum (normalizeSourceTechnology.ts).
- 8d71b85: Removing Abbreviation from project's details. Replaced by project directory calculated from the project's name.
- Updated dependencies [e887fb4]
- Updated dependencies [f13f2c5]
- Updated dependencies [daaea27]
- Updated dependencies [8d71b85]
  - @red-hat-developer-hub/backstage-plugin-x2a-common@1.3.0

## 0.3.1

### Patch Changes

- Updated dependencies [ff39f9a]
  - @red-hat-developer-hub/backstage-plugin-x2a-common@1.2.1

## 0.3.0

### Minor Changes

- 53a0ccf: Bump all dependencies to match RHDH 1.9.3

### Patch Changes

- Updated dependencies [53a0ccf]
  - @red-hat-developer-hub/backstage-plugin-x2a-common@1.2.0

## 0.2.0

### Minor Changes

- 613b44e: Forced minor version bump.

### Patch Changes

- b0c80b1: Moving conversion-project-template.yaml template under scaffolder-backend-module-x2a for easier distribution.
- 7565e2e: Add the Cancel phase migration action.
- 5d26b30: Add Bitbucket repository support.
- e9f35e2: The user can newly bulk-create conversion projects from an uploaded CSV file.
- Updated dependencies [4fb1a6e]
- Updated dependencies [613b44e]
- Updated dependencies [50fa945]
- Updated dependencies [7565e2e]
- Updated dependencies [f3f900e]
- Updated dependencies [5d26b30]
- Updated dependencies [e9f35e2]
  - @red-hat-developer-hub/backstage-plugin-x2a-common@1.1.0

## 0.1.2

### Patch Changes

- 01999f1: Introducing projects by groups. Additional RBAC hardening.
  - require x2a permissions to access the UI
  - enforce better the x2a permissions on the endpoints
  - projects can be optionally owned by a Backstage group, still defaults to the logged-in user

- 0c598fb: Add GitLab support.
- Updated dependencies [0c598fb]
  - @red-hat-developer-hub/backstage-plugin-x2a-common@1.0.2

## 0.1.1

### Patch Changes

- 2fc6542: Adding scaffolder software template for creating conversion projects and corresponding action.
- b7862f2: Adding collapsible row detail to the Project List.
- Updated dependencies [2fc6542]
- Updated dependencies [4465f5c]
- Updated dependencies [3c49eed]
- Updated dependencies [b7862f2]
- Updated dependencies [bf9212b]
- Updated dependencies [e9964fb]
- Updated dependencies [a97b036]
- Updated dependencies [877acc1]
  - @red-hat-developer-hub/backstage-plugin-x2a-common@1.0.1
