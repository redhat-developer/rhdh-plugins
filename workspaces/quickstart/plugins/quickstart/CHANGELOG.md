# @red-hat-developer-hub/backstage-plugin-quickstart

## 1.8.1

### Patch Changes

- f74564d: Added 'it' and 'ja' i18n support and updated 'fr' translation strings.
- 98abe8b: Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.11.0`.
- 04630bf: Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.12.0`.

## 1.8.0

### Minor Changes

- 8e269d3: Backstage version bump to v1.45.2

### Patch Changes

- c6c029b: allow base64 image in quickstart icons

## 1.7.0

### Minor Changes

- e9adef8: Backstage version bump to v1.44.2

## 1.6.2

### Patch Changes

- f1b0f1a: Add package.json exports configuration for alpha module support.

  - Add exports field to support importing from alpha module
  - Add typesVersions configuration for TypeScript support

## 1.6.1

### Patch Changes

- def4673: Fixes the issue where the quickstart drawer was reserving space for users with no eligible items

  - Centralize role determination at provider level to avoid re-fetching on drawer open/close
  - Add multi-layer protection to prevent empty drawer space when user has no eligible quickstart items
  - Remove complex caching logic from useQuickstartRole hook for cleaner implementation
  - Update components to use role from context instead of calling hook directly
  - Fix test mocks to work with new context-based architecture

  This resolves the issue where the quickstart drawer would open an empty space when the current user has no quickstart items configured for their role.

## 1.6.0

### Minor Changes

- dcda8f3: Adding localization support for quickstart steps.

### Patch Changes

- b887a58: French translation updated

## 1.5.1

### Patch Changes

- 9057587: Fix Quickstart drawer re-opening on close by scoping drawer flags per user, caching resolved role per session, and filtering items only when the drawer is open; preserves first-time auto-open and respects manual close.

## 1.5.0

### Minor Changes

- d49b252: Backstage version bump to v1.42.5

### Patch Changes

- e8cc528: Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.10.0` and move it from plugin dependencies to devDependencies.

## 1.4.0

### Minor Changes

- 47fd25f: Enabled Quickstart items for developer role.

## 1.3.0

### Minor Changes

- bc88e5f: Add internationalization (i18n) support with German, French and Spanish translations in quickstart.

## 1.2.0

### Minor Changes

- 0e0f2f5: Backstage version bump to v1.41.2

### Patch Changes

- f89f72f: Updated dependency `@mui/icons-material` to `5.18.0`.
  Updated dependency `@mui/material` to `5.18.0`.

## 1.1.1

### Patch Changes

- 0c449b8: Fix to set quickstart-open local-storage key to true on first user visit.

## 1.1.0

### Minor Changes

- 7eb9524: - Add QuickstartButton to use context and remove localstorage logic for opening/closing of drawer.
  - Add a custom class `.quickstart-drawer-open` on document.body that can be used to adjust styles across the app.
  - Update QuickstartDrawer styles to handle header height.

## 1.0.0

### Major Changes

- 4f8249b: First version of quickstart plugin
