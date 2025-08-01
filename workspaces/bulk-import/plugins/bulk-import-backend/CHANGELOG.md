### Dependencies

## 6.1.7

### Patch Changes

- 760b519: Fixes `/imports` endpoint unable to edit `catalog-info.yaml` PR

## 6.1.6

### Patch Changes

- 5f50921: Fixes `/imports` endpoint unable to create `catalog-info.yaml` PR in rhdh-local

## 6.1.5

### Patch Changes

- 0fb7550: Fixes `/imports` endpoint unable to create `catalog-info.yaml` PR

## 6.1.4

### Patch Changes

- a79f849: Updated dependency `prettier` to `3.6.2`.
- Updated dependencies [a79f849]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.7.2

## 6.1.3

### Patch Changes

- 22e947b: Bump to backstage version 1.39.1
- Updated dependencies [22e947b]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.7.1

## 6.1.2

### Patch Changes

- 9171b96: Updated dependency `@types/express` to `4.17.23`.
- 8c2e067: Updated dependency `openapicmd` to `2.7.0`.
  Updated dependency `@mui/styles` to `5.17.1`.
  Updated dependency `@playwright/test` to `1.52.0`.

## 6.1.1

### Patch Changes

- 571d93e: Updated dependency `@types/express` to `4.17.22`.
- be43040: Updated dependency `@openapitools/openapi-generator-cli` to `2.20.2`.
  Updated dependency `openapicmd` to `2.6.2`.

## 6.1.0

### Minor Changes

- 361daf4: Backstage version bump to v1.38.1

### Patch Changes

- a9e5f32: Updated dependency `@openapitools/openapi-generator-cli` to `2.20.0`.
  Updated dependency `prettier` to `3.5.3`.
  Updated dependency `@redhat-developer/red-hat-developer-hub-theme` to `0.5.1`.
  Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.6.0`.
  Updated dependency `@janus-idp/cli` to `3.5.0`.
- Updated dependencies [a9e5f32]
- Updated dependencies [361daf4]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.7.0

## 6.0.0

### Major Changes

- b806644: Use newer audit-log package from Backstage. Note: Breaking change – audit log format has changed.

## 5.4.0

### Minor Changes

- 95b14e6: Backstage version bump to v1.36.1

### Patch Changes

- Updated dependencies [95b14e6]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.6.0

## 5.3.0

### Minor Changes

- fbbd37f: Backstage version bump to v1.35.0

### Patch Changes

- 05a1ce0: Updated dependency `@openapitools/openapi-generator-cli` to `2.16.3`.
- 816d8bc: Updated dependency `@openapitools/openapi-generator-cli` to `2.16.2`.
- Updated dependencies [fbbd37f]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.5.0

## 5.2.2

### Patch Changes

- b47ad99: Implemented Server Side Sorting for `GET /imports`

## 5.2.1

### Patch Changes

- 97534e9: Updated dependency `@types/express` to `4.17.21`.
- 18547a0: Updated dependency `msw` to `1.3.5`.
- d59e940: Updated dependency `@openapitools/openapi-generator-cli` to `2.15.3`.
  Updated dependency `openapicmd` to `2.6.1`.
  Updated dependency `prettier` to `3.4.2`.
- Updated dependencies [d59e940]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.4.2

## 5.2.0

### Minor Changes

- be29a84: Introduced a new response key 'source' in the GET /imports endpoint to indicate from which source the import originated from ('config', 'location', 'integration'). In case of duplicates, it returns first source it finds in order 'config', 'location', 'integration'.

## 5.1.1

### Patch Changes

- b910e0b: bump @backstage/repo-tools to 0.10.0 and regenerate api reports
- Updated dependencies [b910e0b]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.4.1

## 5.1.0

### Minor Changes

- 919f996: rebase with latest changes from janus

### Patch Changes

- Updated dependencies [919f996]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.4.0

## 5.0.1

### Patch Changes

- 07bf748: Migrated from [janus-idp/backstage-plugins](https://github.com/janus-idp/backstage-plugins).
- Updated dependencies [07bf748]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.3.1

## 5.0.0

### Minor Changes

- 8244f28: chore(deps): update to backstage 1.32

### Patch Changes

- Updated dependencies [8244f28]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.3.0
  - @janus-idp/backstage-plugin-audit-log-node@1.7.0

## 4.0.1

### Patch Changes

- 7342e9b: chore: remove @janus-idp/cli dep and relink local packages

  This update removes `@janus-idp/cli` from all plugins, as it’s no longer necessary. Additionally, packages are now correctly linked with a specified version.

## 4.0.0

### Minor Changes

- d9551ae: feat(deps): update to backstage 1.31

### Patch Changes

- d9551ae: Change local package references to a `*`
- d9551ae: pin the @janus-idp/cli package
- d9551ae: upgrade to yarn v3
- d9551ae: Change the export-dynamic script to no longer use any flags and remove the tracking of the dist-dynamic folder
- Updated dependencies [d9551ae]
- Updated dependencies [d9551ae]
- Updated dependencies [d9551ae]
  - @red-hat-developer-hub/backstage-plugin-bulk-import-common@1.2.0
  - @janus-idp/backstage-plugin-audit-log-node@1.6.0

* **@janus-idp/cli:** upgraded to 1.15.2

### Dependencies

- **@janus-idp/backstage-plugin-audit-log-node:** upgraded to 1.5.1

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-bulk-import-common:** upgraded to 1.1.1

### Dependencies

- **@janus-idp/cli:** upgraded to 1.15.1

### Dependencies

- **@janus-idp/cli:** upgraded to 1.15.0

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-bulk-import-common:** upgraded to 1.1.0
- **@janus-idp/cli:** upgraded to 1.14.0
- **@janus-idp/backstage-plugin-audit-log-node:** upgraded to 1.5.0

### Dependencies

- **@janus-idp/cli:** upgraded to 1.13.2

### Dependencies

- **@janus-idp/backstage-plugin-audit-log-node:** upgraded to 1.4.1

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-bulk-import-common:** upgraded to 1.0.1

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-bulk-import-common:** upgraded to 1.0.1

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-bulk-import-common:** upgraded to 1.0.1

### Dependencies

- **@janus-idp/backstage-plugin-audit-log-node:** upgraded to 1.0.0
- **@red-hat-developer-hub/backstage-plugin-bulk-import-common:** upgraded to 1.0.0

### Dependencies

- **@red-hat-developer-hub/backstage-plugin-bulk-import-common:** upgraded to 1.0.0
- **@janus-idp/cli:** upgraded to 1.0.0

### Dependencies

- **@janus-idp/cli:** upgraded to 1.13.1

## @red-hat-developer-hub/backstage-plugin-bulk-import-backend [0.2.0](https://github.com/janus-idp/backstage-plugins/compare/@red-hat-developer-hub/backstage-plugin-bulk-import-backend@0.1.0...@red-hat-developer-hub/backstage-plugin-bulk-import-backend@0.2.0) (2024-07-25)

### Features

- **deps:** update to backstage 1.29 ([#1900](https://github.com/janus-idp/backstage-plugins/issues/1900)) ([f53677f](https://github.com/janus-idp/backstage-plugins/commit/f53677fb02d6df43a9de98c43a9f101a6db76802))

### Dependencies

- **@janus-idp/cli:** upgraded to 1.13.0
