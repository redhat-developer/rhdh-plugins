---
'@red-hat-developer-hub/plugin-cost-management-common': minor
'@red-hat-developer-hub/plugin-cost-management-backend': minor
---

**BREAKING**: Changed permission name separator from `.` to `/` for cluster-specific and cluster-project-specific permissions.

This resolves an ambiguity where dotted cluster names (e.g., `my.cluster`) could not be distinguished from the separator in permission names like `ros.my.cluster.project`.

New format:

- `ros/{clusterName}` and `ros/{clusterName}/{projectName}` (was `ros.{clusterName}` and `ros.{clusterName}.{projectName}`)
- `cost/{clusterName}` and `cost/{clusterName}/{projectName}` (was `cost.{clusterName}` and `cost.{clusterName}.{projectName}`)

Generic permissions (`ros.plugin`, `ros.apply`, `cost.plugin`) are unchanged.

See `docs/rbac.md` for a migration guide.
