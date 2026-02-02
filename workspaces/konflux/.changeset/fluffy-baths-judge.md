---
'@red-hat-developer-hub/backstage-plugin-konflux-backend': patch
'@red-hat-developer-hub/backstage-plugin-konflux-common': patch
'@red-hat-developer-hub/backstage-plugin-konflux': patch
---

Move backend-only config (serviceAccountToken) into konflux-backend config.d.ts to avoid frontend/secret visibility conflicts during dynamic schema merge.
