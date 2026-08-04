---
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-api': minor
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-react': minor
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-widgets': minor
---

Add field-level validation support via `ui:validateOn` and `ui:validateGroup` schema annotations. Fields can now trigger async validation on blur, change, or both without waiting for Next/Submit. Dependent fields sharing a `ui:validateGroup` are validated together once all group members have values.
