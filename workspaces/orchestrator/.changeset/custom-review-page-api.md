---
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-api': minor
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-react': minor
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-widgets': minor
---

Add custom review page API support

**Custom Review Page API:**

- Add `ReviewComponentProps` type to define props for custom review components
- Add optional `getReviewComponent()` method to `OrchestratorFormApi` interface
- Update `OrchestratorForm` to support custom review page components from plugins
- Add `CustomReviewPage` example component in orchestrator-form-widgets plugin
- Falls back to default review page when `getReviewComponent()` returns `undefined`

**Documentation:**

- Update `extensibleForm.md` with custom review page implementation guide
- Add example showing how to implement and use custom review components
