---
'@red-hat-developer-hub/backstage-plugin-orchestrator-form-react': minor
---

Prune obsolete properties from form data before Review and Submit

- Update `OrchestratorForm` to prune form data before passing to Review step and execution
- Fixes issue where SchemaUpdater dynamically adds/removes fields but old values remain in form state
- Ensures only properties that exist in the final schema version are displayed on Review page and submitted
- Prevents stale data from previous schema versions from being included in workflow execution
