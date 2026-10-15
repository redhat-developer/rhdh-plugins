---
'@red-hat-developer-hub/backstage-plugin-dcm': patch
'@red-hat-developer-hub/backstage-plugin-dcm-backend': patch
---

Expose `dcm.auth.enabled` to the frontend config schema.

The frontend previously received `dcm.auth.enabled` as undefined when it was
set to false, so auth-disabled deployments incorrectly required an OIDC auth
API factory. Both plugin schemas now declare the setting with frontend
visibility so the bundled UI can honor auth-disabled mode.
