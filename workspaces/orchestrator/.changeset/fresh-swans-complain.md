---
'@red-hat-developer-hub/backstage-plugin-orchestrator-backend': minor
'@red-hat-developer-hub/backstage-plugin-orchestrator-common': minor
'@red-hat-developer-hub/backstage-plugin-orchestrator': minor
'@red-hat-developer-hub/backstage-plugin-scaffolder-backend-module-orchestrator': patch
---

Add conditional RBAC policy support for orchestrator workflows using the `IS_ALLOWED_WORKFLOW_ID` rule. Dynamic workflow-specific permissions (`orchestrator.workflow.<workflowId>` and `orchestrator.workflow.use.<workflowId>`) are deprecated and will be removed in the next release.

Migrate from deprecated dynamic permissions to conditional policies. See `docs/MIGRATION-CONDITIONAL-POLICIES.md`.
