---
'@red-hat-developer-hub/plugin-cost-management-backend': patch
---

fix: register dynamic RBAC permissions for cluster/project tiers (FLPATH-4207)

Cluster-specific permissions (ros/<cluster>, ros/<cluster>/<project>) were created
at runtime but never registered with createPermissionIntegrationRouter. The RHDH
RBAC backend only evaluates registered permissions — unregistered ones get DENY by
default, breaking the 3-tier RBAC model. Now fetches cluster/project data at router
init and registers all dynamic permissions. Also improves secureProxy.ts error
messages to include request path and error details.
