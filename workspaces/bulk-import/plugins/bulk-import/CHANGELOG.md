### Dependencies

## 1.12.1

### Patch Changes

- d5cc14d: added MUI class generator

## 1.12.0

### Minor Changes

- 95b14e6: Backstage version bump to v1.36.1

### Patch Changes

- 4a1f79b: fixing extra apis call on added repository list
- 680ede5: Updated dependency `@mui/icons-material` to `5.16.14`.
  Updated dependency `@mui/styles` to `5.16.14`.
  Updated dependency `@mui/material` to `5.16.14`.
  Updated dependency `@mui/styled-engine` to `5.16.14`.
- Updated dependencies [95b14e6]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.6.0

## 1.11.0

### Minor Changes

- fbbd37f: Backstage version bump to v1.35.0

### Patch Changes

- 28769f6: Update Readme to point to right link
- a87d02d: Updated dependency `start-server-and-test` to `2.0.10`.
  Updated dependency `sass` to `1.83.4`.
  Updated dependency `ts-loader` to `9.5.2`.
- Updated dependencies [fbbd37f]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.5.0

## 1.10.8

### Patch Changes

- b47ad99: Implemented Server Side Sorting for `GET /imports`

## 1.10.7

### Patch Changes

- f627fd2: Updated dependency `@mui/icons-material` to `5.16.13`.
  Updated dependency `@mui/material` to `5.16.13`.
  Updated dependency `@mui/styles` to `5.16.13`.
- e9e670c: Updated dependency `@mui/icons-material` to `5.16.11`.
- 18547a0: Updated dependency `msw` to `1.3.5`.
- d59e940: Updated dependency `@openapitools/openapi-generator-cli` to `2.15.3`.
  Updated dependency `openapicmd` to `2.6.1`.
  Updated dependency `prettier` to `3.4.2`.
- 2743f5b: Updated dependency `start-server-and-test` to `2.0.9`.
- 414250a: Updated dependency `@playwright/test` to `1.49.1`.
- Updated dependencies [d59e940]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.4.2

## 1.10.6

### Patch Changes

- 462bfde: Persist changes made in the preview pull request form when PR is waiting to be approved

## 1.10.5

### Patch Changes

- ea3e1df: fix add repository pagination padding/position

## 1.10.4

### Patch Changes

- 734d971: Fixed a bug in the bulk-import plugin where the "Check All" checkbox was incorrectly selected when the total number of selected repositories across multiple pages matched the number of rows in the current table

## 1.10.3

### Patch Changes

- 0afb197: Disable Delete button for repositories that are not sourced from `location`.

## 1.10.2

### Patch Changes

- b910e0b: bump @backstage/repo-tools to 0.10.0 and regenerate api reports
- Updated dependencies [b910e0b]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.4.1

## 1.10.1

### Patch Changes

- faa82f1: Removed canvas as a devDependency

## 1.10.0

### Minor Changes

- ab15e37: use react query to fetch repositories

## 1.9.0

### Minor Changes

- 06f1869: update preview form to use separate formik context

## 1.8.0

### Minor Changes

- 919f996: rebase with latest changes from janus

### Patch Changes

- Updated dependencies [919f996]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.4.0

## 1.7.1

### Patch Changes

- 07bf748: Migrated from [janus-idp/backstage-plugins](https://github.com/janus-idp/backstage-plugins).
- Updated dependencies [07bf748]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.3.1

## 1.7.0

### Minor Changes

- 8244f28: chore(deps): update to backstage 1.32

### Patch Changes

- Updated dependencies [8244f28]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.3.0
  - @janus-idp/shared-react@2.13.0

## 1.6.1

### Patch Changes

- 7342e9b: chore: remove @janus-idp/cli dep and relink local packages

  This update removes `@janus-idp/cli` from all plugins, as it’s no longer necessary. Additionally, packages are now correctly linked with a specified version.

## 1.6.0

### Minor Changes

- d9551ae: update bulk import ui as per the api response
- d9551ae: feat(deps): update to backstage 1.31

### Patch Changes

- d9551ae: Change local package references to a `*`
- d9551ae: pin the @janus-idp/cli package
- d9551ae: upgrade to yarn v3
- Updated dependencies [d9551ae]
- Updated dependencies [d9551ae]
- Updated dependencies [d9551ae]
- Updated dependencies [d9551ae]
  - @janus-idp/shared-react@2.12.0
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.2.0

* **@janus-idp/cli:** upgraded to 1.15.2

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-bulk-import-common:** upgraded to 1.1.1

### Dependencies

- **@janus-idp/cli:** upgraded to 1.15.1

### Dependencies

- **@janus-idp/shared-react:** upgraded to 2.11.1
- **@janus-idp/cli:** upgraded to 1.15.0

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-bulk-import-common:** upgraded to 1.1.0
- **@janus-idp/shared-react:** upgraded to 2.11.0
- **@janus-idp/cli:** upgraded to 1.14.0

### Dependencies

- **@janus-idp/cli:** upgraded to 1.13.2

### Dependencies

- **@janus-idp/shared-react:** upgraded to 2.10.3

### Dependencies

- **@janus-idp/shared-react:** upgraded to 2.10.2

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-bulk-import-common:** upgraded to 1.0.1

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-bulk-import-common:** upgraded to 1.0.1

### Dependencies

- **@janus-idp/shared-react:** upgraded to 2.10.1

### Dependencies

- **@janus-idp/cli:** upgraded to 1.13.1

## @red-hat-developer-hub/backstage-plugin-bulk-import [1.2.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-bulk-import@1.1.5...@red-hat-developer-hub/backstage-plugin-bulk-import@1.2.0) (2024-08-06)

### Features

- **bulk-import:** add fields for annotations, labels and spec input ([#1950](https://github.com/janus-idp/backstage-plugins/issues/1950)) ([a1b790a](https://github.com/janus-idp/backstage-plugins/commit/a1b790a021a355046fc9c592812fc15f7cbda1fb))

## @red-hat-developer-hub/backstage-plugin-bulk-import [1.1.5](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-bulk-import@1.1.4...@red-hat-developer-hub/backstage-plugin-bulk-import@1.1.5) (2024-08-02)

### Dependencies

- **@janus-idp/shared-react:** upgraded to 2.10.0

## @red-hat-developer-hub/backstage-plugin-bulk-import [1.1.4](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-bulk-import@1.1.3...@red-hat-developer-hub/backstage-plugin-bulk-import@1.1.4) (2024-08-02)

### Dependencies

- **@janus-idp/shared-react:** upgraded to 2.10.0

## @red-hat-developer-hub/backstage-plugin-bulk-import [1.1.3](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-bulk-import@1.1.2...@red-hat-developer-hub/backstage-plugin-bulk-import@1.1.3) (2024-08-02)

### Dependencies

- **@janus-idp/shared-react:** upgraded to 2.10.0

## @red-hat-developer-hub/backstage-plugin-bulk-import [1.1.2](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-bulk-import@1.1.1...@red-hat-developer-hub/backstage-plugin-bulk-import@1.1.2) (2024-08-02)

### Dependencies

- **@janus-idp/shared-react:** upgraded to 2.10.0

## @red-hat-developer-hub/backstage-plugin-bulk-import [1.1.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-bulk-import@1.1.0...@red-hat-developer-hub/backstage-plugin-bulk-import@1.1.1) (2024-07-26)

### Dependencies

- **@janus-idp/shared-react:** upgraded to 2.9.0

## @red-hat-developer-hub/backstage-plugin-bulk-import [1.1.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-bulk-import@1.0.6...@red-hat-developer-hub/backstage-plugin-bulk-import@1.1.0) (2024-07-25)

### Features

- **deps:** update to backstage 1.29 ([#1900](https://github.com/janus-idp/backstage-plugins/issues/1900)) ([f53677f](https://github.com/janus-idp/backstage-plugins/commit/f53677fb02d6df43a9de98c43a9f101a6db76802))

### Bug Fixes

- **deps:** update rhdh dependencies (non-major) ([#1960](https://github.com/janus-idp/backstage-plugins/issues/1960)) ([8b6c249](https://github.com/janus-idp/backstage-plugins/commit/8b6c249f1d2e8097cac0260785c26496a5be1a06))

### Dependencies

- **@janus-idp/shared-react:** upgraded to 2.9.0
- **@janus-idp/cli:** upgraded to 1.13.0

## @red-hat-developer-hub/backstage-plugin-bulk-import [1.0.5](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-bulk-import@1.0.4...@red-hat-developer-hub/backstage-plugin-bulk-import@1.0.5) (2024-04-09)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.7.10

## @red-hat-developer-hub/backstage-plugin-bulk-import [1.0.4](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-bulk-import@1.0.3...@red-hat-developer-hub/backstage-plugin-bulk-import@1.0.4) (2024-04-09)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.7.9

## @red-hat-developer-hub/backstage-plugin-bulk-import [1.0.3](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-bulk-import@1.0.2...@red-hat-developer-hub/backstage-plugin-bulk-import@1.0.3) (2024-04-05)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.7.8

## @red-hat-developer-hub/backstage-plugin-bulk-import [1.0.2](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-bulk-import@1.0.1...@red-hat-developer-hub/backstage-plugin-bulk-import@1.0.2) (2024-04-02)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.7.7

## @red-hat-developer-hub/backstage-plugin-bulk-import [1.0.1](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-bulk-import@1.0.0...@red-hat-developer-hub/backstage-plugin-bulk-import@1.0.1) (2024-03-29)

### Dependencies

- **@janus-idp/cli:** upgraded to 1.7.6

## @red-hat-developer-hub/backstage-plugin-bulk-import 1.0.0 (2024-03-11)

### Features

- **bulk-import:** create bulk-import frontend plugin ([#1327](https://github.com/janus-idp/backstage-plugins/issues/1327)) ([e03f47f](https://github.com/janus-idp/backstage-plugins/commit/e03f47f1f770823ee79a97a2fa79cec144394b17))
