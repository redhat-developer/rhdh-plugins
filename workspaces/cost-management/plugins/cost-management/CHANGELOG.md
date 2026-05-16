# @red-hat-developer-hub/plugin-cost-management

## 2.2.1

### Patch Changes

- 558b7c3: fix: patch transitive dependency CVEs via yarn resolutions

  Pins vulnerable transitive dependencies to patched versions to address open Dependabot alerts:

- Updated dependencies [558b7c3]
  - @red-hat-developer-hub/plugin-cost-management-common@2.2.1

## 2.2.0

### Minor Changes

- ce8cb07: Add authorization, input validation, and confirmation dialog for Apply Recommendation workflow.

  - New `ros.apply` permission required to execute the Apply Recommendation workflow
  - New backend `POST /apply-recommendation` endpoint validates `resourceType` against server-side allowlist and checks `ros.apply` permission before forwarding to Orchestrator
  - Workflow execution now routes through the cost-management backend instead of directly to the Orchestrator plugin, enabling server-side authorization and audit logging
  - Confirmation dialog added before workflow execution to prevent accidental clicks

- ab26a80: Move Cost Management data fetching server-side to eliminate token exposure and RBAC bypass

  - Added secure backend proxy (`/api/cost-management/proxy/*`) that authenticates requests via Backstage httpAuth, checks RBAC permissions, retrieves SSO tokens internally, and injects server-side cluster/project filters before forwarding to the Cost Management API
  - Removed `/token` endpoint that exposed SSO service account credentials to the browser
  - Removed `dangerously-allow-unauthenticated` proxy configuration from `app-config.dynamic.yaml`
  - Updated `OptimizationsClient` and `CostManagementSlimClient` to route through the new secure backend proxy instead of the old Backstage proxy
  - Eliminated client-side RBAC filter injection that could be bypassed by calling the proxy directly

### Patch Changes

- fdcdf41: Fix `menuItems` keys in `app-config.dynamic.yaml` to use dots instead of slashes as path separators, so that "Optimizations" and "OpenShift" are properly nested under the "Cost management" parent menu in the RHDH sidebar.
- 5148408: Migrated to Jest 30 as required by @backstage/cli 0.36.0.
- Updated dependencies [ce8cb07]
- Updated dependencies [5148408]
- Updated dependencies [7b7bab9]
- Updated dependencies [ab26a80]
  - @red-hat-developer-hub/plugin-cost-management-common@2.2.0

## 2.0.1

### Patch Changes

- a889090: - Migrate from rhdh-theme to the theme within rhdh-plugins repo
  - Fix package name in README and CHANGELOG
  - Align pluginId in package.json to group pluginPackages
- Updated dependencies [a889090]
- Updated dependencies [03c0a11]
  - @red-hat-developer-hub/plugin-cost-management-common@2.0.1

## 2.0.0

### Major Changes

- 02bf923: plugin for viewing and applying Red Hat Insight recommendations
- 67c18a8: sync with original repo

### Patch Changes

- Updated dependencies [02bf923]
- Updated dependencies [67c18a8]
  - @red-hat-developer-hub/plugin-cost-management-common@2.0.0
