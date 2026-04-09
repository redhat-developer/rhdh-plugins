---
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-react': patch
---

Fix `extractUiSchema` so `ui:*` directives on object schemas that define `properties` (for example `ui:hidden` on a `workflowParams` object) are copied into the generated UI schema.
