---
'@red-hat-developer-hub/backstage-plugin-dcm-backend': patch
---

Fix 502 error when SSO credentials are not configured.

The backend proxy now skips the SSO token exchange when `clientId` or
`clientSecret` are absent, forwarding requests to the API gateway without
an Authorization header instead of failing with "Failed to obtain upstream
access token."
