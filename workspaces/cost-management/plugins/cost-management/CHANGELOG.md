# @red-hat-developer-hub/plugin-cost-management

## 2.2.1

### Patch Changes

- 558b7c3: fix: patch transitive dependency CVEs via yarn resolutions

  Pins vulnerable transitive dependencies to patched versions to address open Dependabot alerts:

- 815580b: fix: additional CVE patches and dependency updates for 2.2.1

  Covers the following changes merged after the initial CVE patch (558b7c3):

  - chore(deps): update rhdh cost management dependencies (patch) (#3000) — bumps
    `@aws-sdk/core/fast-xml-parser` to 4.5.6, `request/form-data` to 2.5.5,
    `request/tough-cookie` to 4.1.4, `typeorm` to 0.3.29, and `file-type` to 21.3.4
    via yarn resolutions

  - fix: resolve lodash CVEs via workspace resolution (#3135) — pins lodash to 4.18.1
    to address GHSA-r5fr-rjxr-66jc (Code Injection via _.template, CVSS 8.1) and
    GHSA-f23m-r3pf-42rh (Prototype Pollution via _.unset/\_.omit, CVSS 6.5)

  - fix: update lodash direct deps to 4.18.1 to close Dependabot alerts (#3142) —
    updates pinned lodash versions in individual plugin package.json files so
    Dependabot can detect the fix for GHSA-r5fr-rjxr-66jc and GHSA-f23m-r3pf-42rh

  - fix: CVE patches for casbin/minimatch and fast-xml-parser (#3143) — adds
    `casbin/minimatch` resolution to 7.4.8 and bumps `fast-xml-parser` to 5.7.3

  - fix: upgrade @backstage-community/plugin-rbac-backend to ^7.12.4 (#3161) —
    upgrades rbac-backend and rbac-common to address a Backstage backend CVE

  - chore(deps): update linkifyjs to v4.3.3 (#3155) — patch version bump

- Updated dependencies [558b7c3]
- Updated dependencies [815580b]
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
