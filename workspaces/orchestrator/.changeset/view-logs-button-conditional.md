---
'@red-hat-developer-hub/backstage-plugin-orchestrator': patch
'@red-hat-developer-hub/backstage-plugin-orchestrator-common': patch
---

Add conditional View Logs button based on workflowLogProvider configuration

- Add `useLogsEnabled` hook to check if `orchestrator.workflowLogProvider` is configured
- Conditionally render View Logs button in WorkflowResult component based on config
