# @red-hat-developer-hub/backstage-plugin-extensions-backend

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

## 0.11.0

### Minor Changes

- 36a7d6a: **BREAKING** Replace POST with PATCH `/package/:namespace/:name/configuration/disable` endpoint to update packages disabled status

### Patch Changes

- 4d79286: added row actions to the installed packages
  updated disablePackage Client API to make PATCH call instead of POST
- Updated dependencies [4d79286]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.10.1

## 0.10.0

### Minor Changes

- b33db25: Backstage version bump to v1.42.5

### Patch Changes

- Updated dependencies [b33db25]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.10.0

## 0.9.0

### Minor Changes

- fdda9a1: Add internationalization (i18n) support with German, French and Spanish translations in marketplace.
- dad9806: Integrate plugins-info plugin and add `Installed packages` tab with enhanced UI.

  BREAKING: The deprecated `InstallationContextProvider` export behavior changed.

  - We now export a null component `InstallationContextProvider` from `plugin.ts` solely for backward compatibility. It no longer provides context and will be removed in a future release.
  - Migration: There is no replacement API; this was internal-only. Please upgrade to the latest RHDH where features no longer rely on this provider.

  Also:

  - New `Installed packages` tab with dual-source mapping and client-side filtering/pagination.

### Patch Changes

- Updated dependencies [fdda9a1]
- Updated dependencies [cbe1174]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.9.0

## 0.8.0

### Minor Changes

- 8887468: Backstage version bump to v1.41.1

### Patch Changes

- Updated dependencies [8887468]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.8.0

## 0.7.4

### Patch Changes

- Updated dependencies [171b7fd]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.7.2

## 0.7.3

### Patch Changes

- fb23720: Introduce `spec.integrity` field for Marketplace package
- Updated dependencies [fb23720]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.7.1

## 0.7.2

### Patch Changes

- 7aa3823: Restrict access to configuration endpoints in production

## 0.7.1

### Patch Changes

- 8ada066: Update all plugin packages via PATCH `/plugin/:namespace/:name/configuration/disable`

## 0.7.0

### Minor Changes

- f70ccb1: Use plugin permissions in package configuration endpoints. `AuthorizeResult` for particular package is based upon if user has ALLOW permission for any of plugins that contain this package. Removes unused `extensions-package` permissions.

### Patch Changes

- Updated dependencies [f70ccb1]
- Updated dependencies [7aac60c]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.7.0

## 0.6.0

### Minor Changes

- 3973839: Introduces PUT endpoint for enabling or disabling dynamic plugins: `/plugin/:namespace/:name/configuration/disable` and POST endpoint for enabling or disabling dynamic packages `/package/:namespace/:name/configuration/disable` not already existing in `EXTENSIONS_PLUGIN_CONFIG`.

### Patch Changes

- ca2e330: Bump to backstage version 1.39.1
- 58ae1fe: Added an alert for production environment
  Integrated the fetch configuration and install API calls
  Fixed an import error
- Updated dependencies [ca2e330]
- Updated dependencies [3973839]
- Updated dependencies [58ae1fe]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.6.0

## 0.5.0

### Minor Changes

- 7ae0ca0: Introduces POST endpoints for updating dynamic plugins and packages installation configuration: `/package/:namespace/:name/configuration` and `/plugin/:namespace/:name/configuration`.

### Patch Changes

- Updated dependencies [7ae0ca0]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.5.0

## 0.4.0

### Minor Changes

- 7d138e5: Added extension permissions
- f56908a: Introduces GET endpoints for dynamic plugins configuration: `/package/:namespace/:name/configuration` and `/plugin/:namespace/:name/configuration`. Introduces optional config value `extensions.installation` which is used for installation configuration.

### Patch Changes

- 4413eef: updated `extension` to `extensions`
  update marketplace pluginId to extensions
- Updated dependencies [4413eef]
- Updated dependencies [7d138e5]
- Updated dependencies [f56908a]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.4.0

## 0.3.1

### Patch Changes

- 0f6f539: Allows packages API to return 'spec.appConfigExamples' data.

## 0.3.0

### Minor Changes

- 6501387: Backstage version bump to v1.36.1

### Patch Changes

- Updated dependencies [6501387]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.3.0

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

## 0.0.9

### Patch Changes

- Updated dependencies [f310add]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.0.9

## 0.0.8

### Patch Changes

- 4e0ec06: add optional sorting, filtering, pagination to marketplace api
- Updated dependencies [4e0ec06]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.0.8

## 0.0.7

### Patch Changes

- 9a3c185: replace custom aggregation api endpoint with catalog entity-facets api
- Updated dependencies [9a3c185]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.0.7

## 0.0.6

### Patch Changes

- Updated dependencies [0bcb97f]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.0.6

## 0.0.5

### Patch Changes

- 381a250: Upgrade Backstage from 1.32.0 to 1.35.0
- Updated dependencies [381a250]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.0.5

## 0.0.4

### Patch Changes

- 113ff0d: Add new aggregation api in marketplace
- Updated dependencies [113ff0d]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.0.4

## 0.0.3

### Patch Changes

- 58c2d47: Add new endpoints in marketplace.
- Updated dependencies [58c2d47]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.0.3

## 0.0.2

### Patch Changes

- Updated dependencies [8c442b6]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.0.2

## 0.0.1

### Patch Changes

- 56f9484: release marketplace plugin
- Updated dependencies [56f9484]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.0.1
