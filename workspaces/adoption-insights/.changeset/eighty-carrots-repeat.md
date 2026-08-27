---
'@red-hat-developer-hub/backstage-plugin-adoption-insights': patch
---

Cover the new frontend system wiring with createExtensionTester: the page's path, title and route ref, and that both the page and the API extension are registered on the plugin. The existing alpha tests all pass against a plugin whose extensions array is empty, which is one of the two ways an NFS plugin fails silently.
