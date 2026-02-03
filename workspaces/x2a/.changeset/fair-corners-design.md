---
'@red-hat-developer-hub/backstage-plugin-x2a-backend': patch
'@red-hat-developer-hub/backstage-plugin-x2a-common': patch
'@red-hat-developer-hub/backstage-plugin-x2a': patch
---

The Create Project action collects source and target repos. Internally, both are persisted on the Project's level, while the /run endpoints receive fresh (non-expired) tokens only.
