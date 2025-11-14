# @red-hat-developer-hub/marketplace-cli

## 0.12.2

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-marketplace-common@0.12.2

## 0.12.1

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-marketplace-common@0.12.1

## 0.12.0

### Minor Changes

- f8e6f04: Backstage version bump to v1.44.1

### Patch Changes

- Updated dependencies [f8e6f04]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.12.0

## 0.6.1

### Patch Changes

- Updated dependencies [4d79286]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.10.1

## 0.6.0

### Minor Changes

- b33db25: Backstage version bump to v1.42.5

### Patch Changes

- Updated dependencies [b33db25]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.10.0

## 0.5.1

### Patch Changes

- Updated dependencies [fdda9a1]
- Updated dependencies [cbe1174]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.9.0

## 0.5.0

### Minor Changes

- 8887468: Backstage version bump to v1.41.1

### Patch Changes

- Updated dependencies [8887468]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.8.0

## 0.4.10

### Patch Changes

- Updated dependencies [171b7fd]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.7.2

## 0.4.9

### Patch Changes

- Updated dependencies [fb23720]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.7.1

## 0.4.8

### Patch Changes

- Updated dependencies [f70ccb1]
- Updated dependencies [7aac60c]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.7.0

## 0.4.7

### Patch Changes

- ca2e330: Bump to backstage version 1.39.1
- 58ae1fe: Added an alert for production environment
  Integrated the fetch configuration and install API calls
  Fixed an import error
- Updated dependencies [ca2e330]
- Updated dependencies [3973839]
- Updated dependencies [58ae1fe]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.6.0

## 0.4.6

### Patch Changes

- Updated dependencies [7ae0ca0]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.5.0

## 0.4.5

### Patch Changes

- Updated dependencies [4413eef]
- Updated dependencies [7d138e5]
- Updated dependencies [f56908a]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.4.0

## 0.4.4

### Patch Changes

- dd94b9d: use namespace parameter also for packages location

## 0.4.3

### Patch Changes

- e5e4655: use new Backstage `lazy` loading function

## 0.4.2

### Patch Changes

- 7517e3b: (export-csv) Always escape newlines in each CSV cell and add more columns

## 0.4.1

### Patch Changes

- 5a99fdd: use CJS imports instead of ESM to fix double-encapsulation import issue

## 0.4.0

### Minor Changes

- 6501387: Backstage version bump to v1.36.1

### Patch Changes

- Updated dependencies [6501387]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.3.0

## 0.3.0

### Minor Changes

- efc1592: add new marketplace-cli init command
- a4b60fd: Added a new command: `export-csv`, which generates a CSV file given a folder of plugin YAML files

## 0.2.0

### Minor Changes

- d3bcc76: rename apiVersion and annotations to extensions.backstage.io

### Patch Changes

- Updated dependencies [d3bcc76]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.2.0

## 0.1.2

### Patch Changes

- a7e38a9: remove core-plugin-api dependency from common
- Updated dependencies [a7e38a9]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.1.2

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
