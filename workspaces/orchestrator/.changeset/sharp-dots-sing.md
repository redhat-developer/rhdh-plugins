---
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-widgets': patch
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-react': patch
---

Fix multi-step workflow forms dropping or misplacing async validation errors and deep nested field paths.

- @red-hat-developer-hub/backstage-plugin-orchestrator-form-widgets: Fix safeSet deep paths and sequential async validation in getExtraErrors.

- @red-hat-developer-hub/backstage-plugin-orchestrator-form-react: Wrap extraErrors with the active step key so RJSF matches the root schema.
