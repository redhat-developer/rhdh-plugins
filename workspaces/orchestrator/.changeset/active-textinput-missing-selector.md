---
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-widgets': patch
---

Avoid hard failures in ActiveTextInput when `fetch:response:value` points to a missing response property. If JSONata resolves to `undefined` or `null`, treat it as an empty string so retriggered dynamic selector edits do not break the form UI.
