# @red-hat-developer-hub/backstage-plugin-boost-backend

## 0.1.4

### Patch Changes

- 46f6034: Upgrade `boost.agent.list` from `BasicPermission` to `ResourcePermission` for conditional RBAC filtering via `authorizeConditional()`. Add `BoostAuthorizedRequest` type for attaching permission conditions to list-endpoint requests.
- Updated dependencies [46f6034]
  - @red-hat-developer-hub/backstage-plugin-boost-common@0.1.4

## 0.1.3

### Patch Changes

- 5551345: Scaffold AI Catalog frontend plugin, dev app, and dev backend. Adds NFS-only frontend plugin with PageBlueprint, EntityCardBlueprint/EntityContentBlueprint stubs, isAiAsset filter, useAiAssets hook, i18n scaffold, and sample catalog fixtures. Adds boost frontend package to pluginPackages in all boost-family packages.
- Updated dependencies [5551345]
  - @red-hat-developer-hub/backstage-plugin-boost-common@0.1.3
  - @red-hat-developer-hub/backstage-plugin-boost-node@0.1.3

## 0.1.2

### Patch Changes

- 2bf1ba5: bump workspace to Backstage 1.52.0
- Updated dependencies [2bf1ba5]
  - @red-hat-developer-hub/backstage-plugin-boost-common@0.1.2
  - @red-hat-developer-hub/backstage-plugin-boost-node@0.1.2
