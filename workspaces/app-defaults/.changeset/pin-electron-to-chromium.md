---
'@red-hat-developer-hub/backstage-plugin-app-defaults': patch
'@red-hat-developer-hub/backstage-plugin-app-auth': patch
'@red-hat-developer-hub/backstage-plugin-app-integrations': patch
'@red-hat-developer-hub/backstage-plugin-app-react': patch
---

Pin `electron-to-chromium` to `1.5.349` via Yarn resolutions so hermetic Konflux/Hermeto builds do not float to freshly published versions that 404 on the cluster npm proxy.
