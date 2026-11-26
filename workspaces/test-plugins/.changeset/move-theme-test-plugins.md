---
'@red-hat-developer-hub/backstage-plugin-bcc-test': patch
'@red-hat-developer-hub/backstage-plugin-bui-test': patch
'@red-hat-developer-hub/backstage-plugin-mui4-test': patch
'@red-hat-developer-hub/backstage-plugin-mui5-test': patch
'@red-hat-developer-hub/backstage-plugin-qe-theme': patch
---

Moved theme workspace test/fixture plugins into the dedicated test-plugins workspace.

Exposed the NFS `createFrontendPlugin` default export on the main package entry (`@public`) instead of `./alpha`.
