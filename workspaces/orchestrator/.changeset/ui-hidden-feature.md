---
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-react': minor
---

Add ui:hidden property to hide fields while preserving functionality

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
- Simplified value rendering for better readability

**Documentation:**

- Update `orchestratorFormWidgets.md` with `ui:hidden` property documentation and usage examples
