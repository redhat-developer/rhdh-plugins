---
'@red-hat-developer-hub/plugin-cost-management-backend': minor
'@red-hat-developer-hub/plugin-cost-management-common': minor
'@red-hat-developer-hub/plugin-cost-management': minor
---

Move Cost Management data fetching server-side to eliminate token exposure and RBAC bypass

- Added secure backend proxy (`/api/cost-management/proxy/*`) that authenticates requests via Backstage httpAuth, checks RBAC permissions, retrieves SSO tokens internally, and injects server-side cluster/project filters before forwarding to the Cost Management API
- Removed `/token` endpoint that exposed SSO service account credentials to the browser
- Removed `dangerously-allow-unauthenticated` proxy configuration from `app-config.dynamic.yaml`
- Updated `OptimizationsClient` and `CostManagementSlimClient` to route through the new secure backend proxy instead of the old Backstage proxy
- Eliminated client-side RBAC filter injection that could be bypassed by calling the proxy directly
