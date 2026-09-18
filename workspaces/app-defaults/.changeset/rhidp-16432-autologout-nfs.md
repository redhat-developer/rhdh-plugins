---
'@red-hat-developer-hub/backstage-plugin-app-defaults': minor
---

Add AutoLogout support to the NFS app via `autoLogoutElement` (`AppRootElementBlueprint`).

The AutoLogout mechanism is disabled by default (`enabled: false`) and reads its
configuration from `auth.autologout.*` in `app-config.yaml`, matching the behaviour
of the legacy OFS implementation (RHIDP-9394). Operators opt in by setting
`auth.autologout.enabled: true`.
