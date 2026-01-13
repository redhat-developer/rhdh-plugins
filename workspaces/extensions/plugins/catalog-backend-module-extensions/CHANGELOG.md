# @red-hat-developer-hub/backstage-plugin-catalog-backend-module-extensions

## 0.14.1

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-extensions-common@0.14.1

## 0.14.0

### Minor Changes

- 4fafdf3: Renamed plugins from marketplace to extensions

  - Renamed all packages from `backstage-plugin-marketplace-*` to `backstage-plugin-extensions-*`
  - Updated all internal references, exports, and API endpoints
  - lazy load codeEditor to reduce the frontend plugin bundle size
  - Made catalog entities directory path configurable via `extensions.directory` in app-config.yaml with fallback to `extensions` and `marketplace` directories

### Patch Changes

- Updated dependencies [4fafdf3]
  - @red-hat-developer-hub/backstage-plugin-extensions-common@0.14.0

## 0.13.2

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-marketplace-common@0.13.2

## 0.13.1

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-marketplace-common@0.13.1

## 0.13.0

### Minor Changes

- bee615a: Backstage version bump to v1.45.2

### Patch Changes

- Updated dependencies [bee615a]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.13.0

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

## 0.7.1

### Patch Changes

- Updated dependencies [4d79286]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.10.1

## 0.7.0

### Minor Changes

- b33db25: Backstage version bump to v1.42.5

### Patch Changes

- Updated dependencies [b33db25]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.10.0

## 0.6.0

### Minor Changes

- fdda9a1: Add internationalization (i18n) support with German, French and Spanish translations in marketplace.
- cbe1174: ### Plugin List Improvements

  - Introduced **"Generally Available"** badge with tooltip
  - Added tooltips for other badges
  - Removed **Verified** badge

  ### Plugin Details Enhancements

  - Added status badges for all support levels: GA, Dev Preview, Tech Preview, Community, Custom
  - Added **Publisher**, **Author**, and **Supported By** metadata
  - Renamed **Supported version** → **Backstage compatibility version**
  - Removed **Verified** status

  ### Enhanced Filtering System

  - Introduced new filters: **Generally Available**, **Dev Preview**, **Tech Preview**, **Community Plugins**
  - Added visual badges with color coding and helper text for filters

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

## 0.4.6

### Patch Changes

- a7d65ee: hide tab layout when there's only one tab left

## 0.4.5

### Patch Changes

- Updated dependencies [171b7fd]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.7.2

## 0.4.4

### Patch Changes

- df4240b: Clear processors log messages

## 0.4.3

### Patch Changes

- Updated dependencies [fb23720]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.7.1

## 0.4.2

### Patch Changes

- 25eef25: Fix plugin `spec.installStatus` updating slowly

## 0.4.1

### Patch Changes

- 62d10e4: Update the definition of `Disabled` installStatus for plugins and packages to refer to those that are preinstalled rather than those that are marked as disabled in the configuration.

## 0.4.0

### Minor Changes

- 7aac60c: Introduces `PluginInstallStatusProcessor` to add `spec.installStatus` for Marketplace plugins. Introduces new `installStatus` values: `ExtensionsPackageInstallStatus.Disabled` and `ExtensionsPluginInstallStatus.Disabled`.

### Patch Changes

- Updated dependencies [f70ccb1]
- Updated dependencies [7aac60c]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.7.0

## 0.3.3

### Patch Changes

- ca2e330: Bump to backstage version 1.39.1
- 85ce547: Fix dynamic plugins install status
- Updated dependencies [ca2e330]
- Updated dependencies [3973839]
- Updated dependencies [58ae1fe]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.6.0

## 0.3.2

### Patch Changes

- Updated dependencies [7ae0ca0]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.5.0

## 0.3.1

### Patch Changes

- Updated dependencies [4413eef]
- Updated dependencies [7d138e5]
- Updated dependencies [f56908a]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.4.0

## 0.3.0

### Minor Changes

- 6501387: Backstage version bump to v1.36.1

### Patch Changes

- Updated dependencies [6501387]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.3.0

## 0.2.3

### Patch Changes

- 4f2bf81: make title and description optional

## 0.2.2

### Patch Changes

- 791a6d4: Fix certified badge in marketplace

## 0.2.1

### Patch Changes

- fab1471: Add marketplace providers to add entities into catalog

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

## 0.0.10

### Patch Changes

- 98083c9: emit package relationships with plugin entity.
- 7e03305: add plugin entity relationship with package entity
- Updated dependencies [f310add]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.0.9

## 0.0.9

### Patch Changes

- Updated dependencies [4e0ec06]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.0.8

## 0.0.8

### Patch Changes

- Updated dependencies [9a3c185]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.0.7

## 0.0.7

### Patch Changes

- 0bcb97f: add Package entity
- Updated dependencies [0bcb97f]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.0.6

## 0.0.6

### Patch Changes

- 381a250: Upgrade Backstage from 1.32.0 to 1.35.0
- Updated dependencies [381a250]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.0.5

## 0.0.5

### Patch Changes

- Updated dependencies [113ff0d]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.0.4

## 0.0.4

### Patch Changes

- 5f09737: Emit pluginlist relationship bidirectionlly to establish complete connections

## 0.0.3

### Patch Changes

- 58c2d47: Add new endpoints in marketplace.
- Updated dependencies [58c2d47]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.0.3

## 0.0.2

### Patch Changes

- 8c442b6: align dependancies versions with backstage 1.32.0
- Updated dependencies [8c442b6]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.0.2

## 0.0.1

### Patch Changes

- 56f9484: release marketplace plugin
- Updated dependencies [56f9484]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.0.1
