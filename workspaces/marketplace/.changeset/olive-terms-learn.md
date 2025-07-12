---
'@red-hat-developer-hub/backstage-plugin-marketplace-backend': minor
'@red-hat-developer-hub/backstage-plugin-marketplace-common': minor
---

Use plugin permissions in package configuration endpoints. `AuthorizeResult` for particular package is based upon if user has ALLOW permission for any of plugins that contain this package. Removes unused `extensions-package` permissions.
