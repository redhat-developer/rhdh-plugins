# @red-hat-developer-hub/marketplace-cli

## 0.1.1

### Patch Changes

- fa70a22: remove unused knex and zod dependency from common package
- Updated dependencies [fa70a22]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.1.1

## 0.1.0

### Minor Changes

- d39d4e3: Initial tech-preview of the marketplace

### Patch Changes

- f16dd69: Refactore and update API, UI, and catalog types
- Updated dependencies [d39d4e3]
- Updated dependencies [f16dd69]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.1.0

## 0.0.3

### Patch Changes

- Updated dependencies [f310add]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.0.9

## 0.0.2

### Patch Changes

- Updated dependencies [4e0ec06]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.0.8

## 0.0.1

### Patch Changes

- 3c12103: Added new `marketplace-cli` and implement `generate` command.

  This command generates Plugin entities based on the information from the [dynamic-plugins.default.yaml](https://github.com/redhat-developer/rhdh/blob/main/dynamic-plugins.default.yaml) and wrapper's `package.json`. It assumes that all `packages` in the config files are wrappers.
