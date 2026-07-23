# @red-hat-developer-hub/backstage-plugin-scorecard-backend-module-filecheck

## 0.2.2

### Patch Changes

- Updated dependencies [c7f89e7]
- Updated dependencies [6ea1575]
  - @red-hat-developer-hub/backstage-plugin-scorecard-node@3.0.0
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@3.0.0

## 0.2.1

### Patch Changes

- 7ead71c: Correct default threshold documentation and add missing threshold documentation in scorecard backend module READMEs to match provider code defaults.
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.8.1
  - @red-hat-developer-hub/backstage-plugin-scorecard-node@2.8.1

## 0.2.0

### Minor Changes

- 8c85bd4: Backstage version bump to v1.51.1

### Patch Changes

- Updated dependencies [efb4c4f]
- Updated dependencies [8c85bd4]
  - @red-hat-developer-hub/backstage-plugin-scorecard-node@2.8.0
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.8.0

## 0.1.11

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-scorecard-common@2.7.9
- @red-hat-developer-hub/backstage-plugin-scorecard-node@2.7.9

## 0.1.10

### Patch Changes

- d37da53: **BREAKING**: Restrict filecheck metric collection to Component catalog entities by adding a kind: component catalog filter.

## 0.1.9

### Patch Changes

- 6699550: Custom thresholds for filecheck, openssf, and dependabot are now
  configurable. Custom threshold handling has been centralized in
  `scorecard-backend`, you can define custom thresholds under
  `scorecard.plugins.<providerId>.thresholds`. Provider IDs typically
  follow the format `<datasource>.<metric>`.
- Updated dependencies [6699550]
  - @red-hat-developer-hub/backstage-plugin-scorecard-node@2.7.8
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.7.8

## 0.1.8

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-scorecard-common@2.7.7
- @red-hat-developer-hub/backstage-plugin-scorecard-node@2.7.7

## 0.1.7

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-scorecard-common@2.7.6
- @red-hat-developer-hub/backstage-plugin-scorecard-node@2.7.6

## 0.1.6

### Patch Changes

- Updated dependencies [5115044]
  - @red-hat-developer-hub/backstage-plugin-scorecard-node@2.7.5
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.7.5

## 0.1.5

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-scorecard-common@2.7.4
- @red-hat-developer-hub/backstage-plugin-scorecard-node@2.7.4

## 0.1.4

### Patch Changes

- 5148408: Migrated to Jest 30 as required by @backstage/cli 0.36.0.
- Updated dependencies [5148408]
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.7.3
  - @red-hat-developer-hub/backstage-plugin-scorecard-node@2.7.3

## 0.1.3

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-scorecard-common@2.7.2
- @red-hat-developer-hub/backstage-plugin-scorecard-node@2.7.2

## 0.1.2

### Patch Changes

- Updated dependencies [91e724f]
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.7.1
  - @red-hat-developer-hub/backstage-plugin-scorecard-node@2.7.1

## 0.1.1

### Patch Changes

- Updated dependencies [bf72ffc]
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.7.0
  - @red-hat-developer-hub/backstage-plugin-scorecard-node@2.7.0

## 0.1.0

### Minor Changes

- 4ecaacd: Add support for batch metric providers, allowing a single provider to handle multiple metrics efficiently. Introduce a new backend module for configurable file existence checks (filecheck.\*) that verify whether required files (like README, LICENSE, or CODEOWNERS) are present in a repository.

### Patch Changes

- Updated dependencies [4ecaacd]
  - @red-hat-developer-hub/backstage-plugin-scorecard-node@2.6.0
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.6.0
