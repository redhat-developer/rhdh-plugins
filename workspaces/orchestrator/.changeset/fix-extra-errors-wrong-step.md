---
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-react': patch
---

Fix validation errors incorrectly shown on wrong step when navigating back.

When using widgets with `validate:url`, the `getExtraErrors` callback validates all fields across all steps and returns a nested error object. The previous logic had full error object when the current step had no errors, causing validation errors from other steps to appear on the wrong step.

This fix:

- Sets `extraErrors` to `undefined` when current step has no errors
- Updates step navigation to only check current step's errors before proceeding
