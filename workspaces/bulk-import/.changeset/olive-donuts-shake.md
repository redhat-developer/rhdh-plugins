---
'@red-hat-developer-hub/backstage-plugin-bulk-import': patch
---

Cover the new frontend system wiring with createExtensionTester: the page's path and title, that the page and the API extension are registered on the plugin, and that both route refs survive. The existing NFS test only covers the translations module, which is a separate FrontendModule — so it stays green against a plugin whose own extensions array is empty.
