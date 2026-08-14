# @red-hat-developer-hub/backstage-plugin-boost-backend

## 0.4.0

### Minor Changes

- 238427a: Entity-Provider SDK — Types, Interfaces, Annotation Validation

### Patch Changes

- Updated dependencies [238427a]
  - @red-hat-developer-hub/backstage-plugin-boost-common@0.3.0
  - @red-hat-developer-hub/backstage-plugin-boost-node@0.2.0

## 0.3.0

### Minor Changes

- e6c850f: Add connector config Zod schemas and RuntimeConfigResolver support for Jira, GitHub, and GitLab connectors. Registers flat leaf keys in `boostConfigFields` with `db-overridable` scope covering enabled, endpoint, schedule, batchSize, timeout, and cron fields. Bumps `BOOST_CONFIG_SCHEMA_VERSION` to 4.

## 0.2.0

### Minor Changes

- 13a24d0: Add ingestion health backend API, data model, and error classification. Introduces `GET /api/boost/ingestion-health` endpoint with per-connector health status derived from recent sync attempts, `SyncAttemptsStore` for tracking sync outcomes, `ErrorClassifier` for categorizing sync failures, and `ConnectorConfigReader` for config-based connector discovery.

### Patch Changes

- Updated dependencies [13a24d0]
  - @red-hat-developer-hub/backstage-plugin-boost-common@0.2.0
  - @red-hat-developer-hub/backstage-plugin-boost-node@0.1.4

## 0.1.4

### Patch Changes

- 46f6034: Upgrade `boost.agent.list` from `BasicPermission` to `ResourcePermission` for conditional RBAC filtering via `authorizeConditional()`. Add `BoostAuthorizedRequest` type for attaching permission conditions to list-endpoint requests.
- 54345de: Rename all Llama Stack references to OGX across the boost workspace. The upstream project has been renamed from llamastack to ogx. This changes npm package names, module IDs, cache key prefixes, config paths, provider identifiers, and entity name prefixes. Consumers must update imports from `@red-hat-developer-hub/backstage-plugin-boost-backend-module-llamastack` to `@red-hat-developer-hub/backstage-plugin-boost-backend-module-ogx` and from `@red-hat-developer-hub/backstage-plugin-llamastack-entity-provider` to `@red-hat-developer-hub/backstage-plugin-ogx-entity-provider`.
- Updated dependencies [46f6034]
- Updated dependencies [54345de]
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
