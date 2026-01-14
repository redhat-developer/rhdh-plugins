---
'@red-hat-developer-hub/backstage-plugin-scaffolder-backend-module-orchestrator': patch
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-widgets': patch
'@red-hat-developer-hub/backstage-plugin-orchestrator-backend': patch
'@red-hat-developer-hub/backstage-plugin-orchestrator': patch
---

Replace deprecated `@janus-idp/cli` with `@red-hat-developer-hub/cli` for dynamic plugin exports.

**Potential Breaking change for frontend plugins build systems:** The `--in-place` flag is no longer used. Frontend plugins now build to `dist-dynamic` instead of `dist-scalprum`. The plugin content remains the same, only the output directory has changed.
