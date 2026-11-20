---
'@red-hat-developer-hub/backstage-plugin-global-header': patch
---

Remove unused search backend packages from the frontend plugin's runtime
dependencies. The development backend continues to declare and load them.
