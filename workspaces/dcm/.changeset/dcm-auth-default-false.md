---
'@red-hat-developer-hub/backstage-plugin-dcm': patch
'@red-hat-developer-hub/backstage-plugin-dcm-backend': patch
---

Default `dcm.auth.enabled` to false when unset.

Dynamic plugin configs now use `${DCM_AUTH_ENABLED:-false}`, and frontend/
backend fallbacks treat a missing setting as auth disabled. Set
`DCM_AUTH_ENABLED=true` (or `dcm.auth.enabled: true`) when the control plane
requires OIDC.
