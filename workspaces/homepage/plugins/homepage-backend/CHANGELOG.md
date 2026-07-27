# @red-hat-developer-hub/backstage-plugin-homepage-backend

## 0.3.0

### Minor Changes

- 0186e63: Add `unless` exclusion block and `tags` for RBAC conditional policy filtering to homepage default widgets.

  `unless` is the denylist counterpart to `if` — it uses the same shape (`users`, `groups`, `permissions`) and hides a widget when any condition matches. Deny wins over `if`, and on group nodes it prunes the entire subtree.

  `tags` is an optional string array on leaf nodes (e.g. `['admin', 'developer']`) used with the new `HAS_TAG` permission rule for RBAC conditional filtering. Widgets without tags bypass tag-based filtering.

### Patch Changes

- Updated dependencies [0186e63]
  - @red-hat-developer-hub/backstage-plugin-homepage-common@0.3.0

## 0.2.1

### Patch Changes

- a25f33d: Renamed the frontend homepage plugin from `@red-hat-developer-hub/backstage-plugin-dynamic-home-page` to `@red-hat-developer-hub/backstage-plugin-homepage` for consistency with the sibling `homepage-backend` and `homepage-common` packages.
- Updated dependencies [a25f33d]
  - @red-hat-developer-hub/backstage-plugin-homepage-common@0.2.1

## 0.2.0

### Minor Changes

- 1aa10e7: Backsatge version bump to v1.51.0

### Patch Changes

- Updated dependencies [1aa10e7]
  - @red-hat-developer-hub/backstage-plugin-homepage-common@0.2.0

## 0.1.3

### Patch Changes

- ab8323b: Fix conditional permission checks.

## 0.1.2

### Patch Changes

- faf1cbd: Make default widgets response optional when no widgets are configured, so that no widget is shown when no conditional widget can be shown.
- Updated dependencies [faf1cbd]
  - @red-hat-developer-hub/backstage-plugin-homepage-common@0.1.2

## 0.1.1

### Patch Changes

- 5148408: Migrated to Jest 30 as required by @backstage/cli 0.36.0.
- Updated dependencies [5148408]
  - @red-hat-developer-hub/backstage-plugin-homepage-common@0.1.1

## 0.1.0

### Minor Changes

- a5a1846: Homepage default content is now resolved through a new backend with RBAC, widget-oriented configuration, and translated titles. Bumps `@red-hat-developer-hub/backstage-plugin-theme` to `^0.14.1`.

  **`@red-hat-developer-hub/backstage-plugin-dynamic-home-page`**

  - Load default widgets from the homepage backend API (permission-aware), with a frontend API client and hooks.

  **`@red-hat-developer-hub/backstage-plugin-homepage-backend` and `@red-hat-developer-hub/backstage-plugin-homepage-common`**

  - Initial release: backend resolves default widgets using user context, `if` conditions; shared types and permission definitions live in homepage-common.

### Patch Changes

- Updated dependencies [a5a1846]
  - @red-hat-developer-hub/backstage-plugin-homepage-common@0.1.0
