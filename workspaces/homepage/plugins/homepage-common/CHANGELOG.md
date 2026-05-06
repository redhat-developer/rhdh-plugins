# @red-hat-developer-hub/backstage-plugin-homepage-common

## 0.1.1

### Patch Changes

- 5148408: Migrated to Jest 30 as required by @backstage/cli 0.36.0.

## 0.1.0

### Minor Changes

- a5a1846: Homepage default content is now resolved through a new backend with RBAC, widget-oriented configuration, and translated titles. Bumps `@red-hat-developer-hub/backstage-plugin-theme` to `^0.14.1`.

  **`@red-hat-developer-hub/backstage-plugin-dynamic-home-page`**

  - Load default widgets from the homepage backend API (permission-aware), with a frontend API client and hooks.

  **`@red-hat-developer-hub/backstage-plugin-homepage-backend` and `@red-hat-developer-hub/backstage-plugin-homepage-common`**

  - Initial release: backend resolves default widgets using user context, `if` conditions; shared types and permission definitions live in homepage-common.
