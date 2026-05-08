# @red-hat-developer-hub/plugin-cost-management-backend

## 2.2.0

### Minor Changes

- ce8cb07: Add authorization, input validation, and confirmation dialog for Apply Recommendation workflow.

  - New `ros.apply` permission required to execute the Apply Recommendation workflow
  - New backend `POST /apply-recommendation` endpoint validates `resourceType` against server-side allowlist and checks `ros.apply` permission before forwarding to Orchestrator
  - Workflow execution now routes through the cost-management backend instead of directly to the Orchestrator plugin, enabling server-side authorization and audit logging
  - Confirmation dialog added before workflow execution to prevent accidental clicks

- 7b7bab9: **BREAKING**: Changed permission name separator from `.` to `/` for cluster-specific and cluster-project-specific permissions.

  This resolves an ambiguity where dotted cluster names (e.g., `my.cluster`) could not be distinguished from the separator in permission names like `ros.my.cluster.project`.

  New format:

  - `ros/{clusterName}` and `ros/{clusterName}/{projectName}` (was `ros.{clusterName}` and `ros.{clusterName}.{projectName}`)
  - `cost/{clusterName}` and `cost/{clusterName}/{projectName}` (was `cost.{clusterName}` and `cost.{clusterName}.{projectName}`)

  Generic permissions (`ros.plugin`, `ros.apply`, `cost.plugin`) are unchanged.

  See `docs/rbac.md` for a migration guide.

- ab26a80: Move Cost Management data fetching server-side to eliminate token exposure and RBAC bypass

  - Added secure backend proxy (`/api/cost-management/proxy/*`) that authenticates requests via Backstage httpAuth, checks RBAC permissions, retrieves SSO tokens internally, and injects server-side cluster/project filters before forwarding to the Cost Management API
  - Removed `/token` endpoint that exposed SSO service account credentials to the browser
  - Removed `dangerously-allow-unauthenticated` proxy configuration from `app-config.dynamic.yaml`
  - Updated `OptimizationsClient` and `CostManagementSlimClient` to route through the new secure backend proxy instead of the old Backstage proxy
  - Eliminated client-side RBAC filter injection that could be bypassed by calling the proxy directly

### Patch Changes

- 5148408: Migrated to Jest 30 as required by @backstage/cli 0.36.0.
- 1df822e: Updated dependency `@types/express` to `4.17.25`.
  Updated dependency `@types/lodash` to `4.17.21`.
- 1df822e: Updated dependency `lodash` to `4.17.23`.
- 1df822e: Updated dependency `@types/lodash` to `4.17.23`.
- 1df822e: Updated dependency `@types/lodash` to `4.17.22`.
- 4f8c5f7: Updated dependency `@types/lodash` to `4.17.24`.
- Updated dependencies [ce8cb07]
- Updated dependencies [5148408]
- Updated dependencies [7b7bab9]
- Updated dependencies [ab26a80]
  - @red-hat-developer-hub/plugin-cost-management-common@2.2.0

## 2.0.2

### Patch Changes

- a889090: - Migrate from rhdh-theme to the theme within rhdh-plugins repo
  - Fix package name in README and CHANGELOG
  - Align pluginId in package.json to group pluginPackages
- 03c0a11: Fix #1317: updated the outdated repository reference.
- Updated dependencies [a889090]
- Updated dependencies [03c0a11]
  - @red-hat-developer-hub/plugin-cost-management-common@2.0.1

## 2.0.1

### Patch Changes

- 59b885a: Updated dependency `@types/lodash` to `4.17.19`.
- 5681ed0: Updated dependency `@types/lodash` to `4.17.20`.

## 2.0.0

### Major Changes

- 02bf923: plugin for viewing and applying Red Hat Insight recommendations
- 67c18a8: sync with original repo

### Patch Changes

- 54ca4c1: Updated dependency `@types/express` to `4.17.23`.
  Updated dependency `@types/lodash` to `4.17.18`.
- Updated dependencies [02bf923]
- Updated dependencies [67c18a8]
  - @red-hat-developer-hub/plugin-cost-management-common@2.0.0

## 1.1.0

### Minor Changes

- 613061d: bump backstage to 1.34.2 and remove @spotify/prettier-config

## 1.0.6

### Patch Changes

- a42b983: Removed usages and references of `@backstage/backend-common`

## 1.0.5

### Patch Changes

- a3c0dc2: Removed `export-dynamic` script and Janus IDP cli from the build process and npm release.

## 1.0.4

### Patch Changes

- 3a1aab2: Backstage version bump to v1.32.2

## 1.0.3

### Patch Changes

- df1288f: Backstage version bump to v1.31.2

## 1.0.2

### Patch Changes

- b209d3b: Backstage version bump to v1.30.2

## 1.0.1

### Patch Changes

- ae2ee8a: Updated dependency `@types/supertest` to `^6.0.0`.
  Updated dependency `supertest` to `^7.0.0`.

## 1.0.0

### Major Changes

- 02dd072: Adds the cost-management plugin

  This is the first iteration for this plugin. Your feedback is more than welcome!
