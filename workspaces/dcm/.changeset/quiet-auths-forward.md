---
'@red-hat-developer-hub/backstage-plugin-dcm': patch
'@red-hat-developer-hub/backstage-plugin-dcm-backend': patch
'@red-hat-developer-hub/backstage-plugin-dcm-common': patch
---

Support DCM authentication-disabled deployments without a host OIDC provider.

The DCM frontend now avoids OIDC API resolution and token forwarding when
`dcm.auth.enabled` is false, while preserving OIDC token forwarding for
authentication-enabled deployments. The backend proxy continues to require
normal RHDH authentication and omits the DCM upstream Authorization header
when DCM authentication is disabled.
