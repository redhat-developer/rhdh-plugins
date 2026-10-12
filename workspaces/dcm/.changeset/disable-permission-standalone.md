---
'@red-hat-developer-hub/backstage-plugin-dcm': patch
'@red-hat-developer-hub/backstage-plugin-dcm-backend': patch
'@red-hat-developer-hub/backstage-plugin-dcm-common': patch
---

Disable Backstage permissions by default in the standalone DCM UI image.

Standalone/compose deployments now set `permission.enabled` to false via
`PERMISSION_ENABLED` (default false) in `app-config.production.yaml`, so
catalog entity-type loading no longer depends on `/api/permission/authorize`
when the RBAC backend has not finished initializing. Set
`PERMISSION_ENABLED=true` when configuring real OIDC and RBAC.
