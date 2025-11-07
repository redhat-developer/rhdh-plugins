# @red-hat-developer-hub/backstage-plugin-marketplace

## 0.12.0

### Minor Changes

- f8e6f04: Backstage version bump to v1.44.1

### Patch Changes

- 06bc4ea: Fixed `installStatus` value on the `Installed packages` tab.
- 2a445d2: Fix Support Type filter count inconsistency when other filters are applied.
- 7ef79ef: Fixed filter function of clicking on "Author" on a plugin card.
- Updated dependencies [f8e6f04]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.12.0

## 0.11.4

### Patch Changes

- b6c9d5c: Disabled row actions in the "Installed packages" tab for the production environment

## 0.11.3

### Patch Changes

- ee0989f: Fixing alignment of Support type filter on plugin list page

## 0.11.2

### Patch Changes

- 4d79286: added row actions to the installed packages
  updated disablePackage Client API to make PATCH call instead of POST
- Updated dependencies [4d79286]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.10.1

## 0.11.1

### Patch Changes

- dd5350f: French translation updated

## 0.11.0

### Minor Changes

- b33db25: Backstage version bump to v1.42.5

### Patch Changes

- b33db25: Update monaco editor from v0.52.2 to v0.53.0
- Updated dependencies [b33db25]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.10.0

## 0.10.0

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

- dad9806: Integrate plugins-info plugin and add `Installed packages` tab with enhanced UI.

  BREAKING: The deprecated `InstallationContextProvider` export behavior changed.

  - We now export a null component `InstallationContextProvider` from `plugin.ts` solely for backward compatibility. It no longer provides context and will be removed in a future release.
  - Migration: There is no replacement API; this was internal-only. Please upgrade to the latest RHDH where features no longer rely on this provider.

  Also:

  - New `Installed packages` tab with dual-source mapping and client-side filtering/pagination.

### Patch Changes

- 72c0abd: keep plugin installation alert closed by default
- Updated dependencies [fdda9a1]
- Updated dependencies [cbe1174]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.9.0

## 0.9.3

### Patch Changes

- f4f76c9: Plugin card UX improvements:

  - Added visual install status indicators (Installed, Disabled) on plugin cards
  - Enhanced hover interaction on category tags with visual feedback
  - Implemented long tag name truncation with ellipsis and full-name tooltips for better layout
  - Fixed alignment for plugin cards without tags to maintain consistent layout
  - Ensured plugin description text always starts at the same horizontal point for better readability

## 0.9.2

### Patch Changes

- 6a561e2: Plugin side drawer UX improvements:

  - Made verified and certified icons smaller for better visual hierarchy
  - Added proper padding, bullet points, and spacing to the Highlights section
  - Applied medium-weight text and proper padding to the About section title
  - Styled Links section title consistently with About section
  - Reduced size of external link icons and improved alignment

## 0.9.1

### Patch Changes

- 76e39f6: display a message when search returns no results

## 0.9.0

### Minor Changes

- 8887468: Backstage version bump to v1.41.1

### Patch Changes

- Updated dependencies [8887468]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.8.0

## 0.8.6

### Patch Changes

- 171b7fd: load all the package configurations
- Updated dependencies [171b7fd]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.7.2

## 0.8.5

### Patch Changes

- 78b2f53: hide extensions alerts while the plugins are still loading

## 0.8.4

### Patch Changes

- fb23720: Introduce `spec.integrity` field for Marketplace package
- Updated dependencies [fb23720]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.7.1

## 0.8.3

### Patch Changes

- 7aa3823: Restrict access to configuration endpoints in production

## 0.8.2

### Patch Changes

- 465bac5: fix install page title in prod env

## 0.8.1

### Patch Changes

- 545c7e7: Updated dependency `@mui/styles` to `5.18.0`.
- c399ade: hide actions menu in view only mode

## 0.8.0

### Minor Changes

- 7aac60c: Introduces `PluginInstallStatusProcessor` to add `spec.installStatus` for Marketplace plugins. Introduces new `installStatus` values: `MarketplacePackageInstallStatus.Disabled` and `MarketplacePluginInstallStatus.Disabled`.

### Patch Changes

- 5ee083d: Fix plugin action button logic to correctly show the "Actions" dropdown when install status is `Installed` or `UpdateAvailable`.
- dc6d0fb: notify users when plugin installation is successful
- Updated dependencies [f70ccb1]
- Updated dependencies [7aac60c]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.7.0

## 0.7.0

### Minor Changes

- 58ae1fe: Added an alert for production environment
  Integrated the fetch configuration and install API calls
  Fixed an import error

### Patch Changes

- ca2e330: Bump to backstage version 1.39.1
- 662c560: add actions button to enable/disable plugin
- 835c5a5: Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.9.0`.
- Updated dependencies [ca2e330]
- Updated dependencies [3973839]
- Updated dependencies [58ae1fe]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.6.0

## 0.6.1

### Patch Changes

- Updated dependencies [7ae0ca0]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.5.0

## 0.6.0

### Minor Changes

- 7d138e5: Added extension permissions

### Patch Changes

- 017dc19: Highlight Category Chip when focus is given through keyboard navigation
- aa27f64: Updated dependency `@scalprum/react-core` to `0.9.5`.
- 8d10acc: Updated dependency `@mui/styles` to `5.17.1`.
  Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.8.0`.
- a87ef79: show error state when backend is missing
- 4413eef: updated `extension` to `extensions`
  update marketplace pluginId to extensions
- Updated dependencies [4413eef]
- Updated dependencies [7d138e5]
- Updated dependencies [f56908a]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.4.0

## 0.5.8

### Patch Changes

- a9e5f32: Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.6.0`.
- 4291395: Hiding `yaml editor` for plugins not having packages.

## 0.5.7

### Patch Changes

- f92389c: add a no-icon-icon when the icon is missing in the plugin metadata

## 0.5.6

### Patch Changes

- e1c4440: fix issue with deselecting the selected filter

## 0.5.5

### Patch Changes

- 81aa8ea: Close chip in filter should remove the selected filter

## 0.5.4

### Patch Changes

- 49b40bd: removing `View plugins` button from no plugins found page

## 0.5.3

### Patch Changes

- 46b3262: add missing grid spacing when loaded as dynamic plugin

## 0.5.2

### Patch Changes

- ff849f7: Minor UI issues fixed

## 0.5.1

### Patch Changes

- ecf3b3e: show error message when the YAML example could not be applied
- ecf3b3e: reduce code editor bundled size (js and js.map)

## 0.5.0

### Minor Changes

- 0f6f539: Add UI to preview and edit plugin configuration

  This update adds a UI that lets users view and edit dynamic plugin configuration. Users can switch between the default config and example configs from the Marketplace Plugin or Package YAML. Changes are not saved yet — this is for preview and exploration only.

## 0.4.0

### Minor Changes

- 6501387: Backstage version bump to v1.36.1

### Patch Changes

- Updated dependencies [6501387]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.3.0

## 0.3.0

### Minor Changes

- 9217bc0: add manaco editor for the upcoming installation page

## 0.2.2

### Patch Changes

- 4f2bf81: render a grey placeholder icon when there is no icon defined
- 4f2bf81: render no description available when there is no description

## 0.2.1

### Patch Changes

- 08a15e5: Remove Filters text and divider

## 0.2.0

### Minor Changes

- d3bcc76: rename apiVersion and annotations to extensions.backstage.io

### Patch Changes

- Updated dependencies [d3bcc76]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.2.0

## 0.1.6

### Patch Changes

- a199551: fix typo
- 0c578a7: fix drawer background color

## 0.1.5

### Patch Changes

- 6f9686f: rename plugin/marketplace to extensions/catalog
- 9073ab8: apply default sorting to filtered plugins api call

## 0.1.4

### Patch Changes

- c977dbc: fix mount points in app-config.dynamic.yaml

## 0.1.3

### Patch Changes

- a7e38a9: remove core-plugin-api dependency from common
- Updated dependencies [a7e38a9]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.1.2

## 0.1.2

### Patch Changes

- fa70a22: remove unused knex and zod dependency from common package
- Updated dependencies [fa70a22]
  - @red-hat-developer-hub/backstage-plugin-marketplace-common@0.1.1

## 0.1.1

### Patch Changes

- 0e2f1ac: restore dynamic plugin export

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
