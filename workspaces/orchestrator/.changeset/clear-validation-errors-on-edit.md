---
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-react': patch
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-widgets': patch
---

Clear async validation errors when the user edits a workflow form field after clicking Next. Only the changed field's error is removed; other field errors remain until that field is edited or the step is validated again. Also handle empty or non-JSON validation responses without breaking the form.
