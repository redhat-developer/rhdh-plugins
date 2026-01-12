---
'@red-hat-developer-hub/backstage-plugin-scaffolder-backend-module-orchestrator': patch
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-widgets': patch
'@red-hat-developer-hub/backstage-plugin-orchestrator-backend': patch
'@red-hat-developer-hub/backstage-plugin-orchestrator': patch
---

Remove deprecated `@janus-idp/cli` devDependency and `export-dynamic` scripts. Dynamic plugin exports are now handled via the [overlay repository](https://github.com/redhat-developer/rhdh-plugin-export-overlays).
