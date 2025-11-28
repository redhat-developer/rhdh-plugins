---
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-api': minor
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-react': minor
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-widgets': minor
---

Add hidden fields and custom review page support

**Hidden Fields Feature:**

- Add `ui:hidden` property to hide fields while preserving widget functionality
- Implement `HiddenFieldTemplate` to render hidden fields with `display: none`
- Hidden fields remain active, participate in validation, and are submitted with form data
- Hidden fields are automatically excluded from the review page
- Update `getSortedStepEntries` to filter out steps marked with `ui:hidden: true`
- Automatically hide entire steps when all inputs within the step are hidden

**Review Page Improvements:**

- Add `NestedReviewTable` component for improved hierarchical display of nested objects
- Update `generateReviewTableData` to skip hidden fields in review page
- Update `generateReviewTableData` to skip entire steps when all fields are hidden

**Custom Review Page API:**

- Add `ReviewComponentProps` type to define props for custom review components
- Add optional `getReviewComponent()` method to `OrchestratorFormApi` interface
- Update `OrchestratorForm` to support custom review page components from plugins
- Add `CustomReviewPage` example component in orchestrator-form-widgets plugin
- Falls back to default review page when `getReviewComponent()` returns `undefined`

**Documentation:**

- Update `extensibleForm.md` with custom review page implementation guide
- Update `orchestratorFormWidgets.md` with `ui:hidden` property documentation and usage examples
