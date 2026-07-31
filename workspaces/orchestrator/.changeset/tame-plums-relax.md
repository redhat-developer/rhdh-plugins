---
'@red-hat-developer-hub/backstage-plugin-orchestrator-backend': minor
---

Add 5 Orchestrator MCP actions (`list-workflows`, `get-workflow-schema`, `execute-workflow`, `list-instances`, `get-instance`) so LLM/CLI clients can discover and run Orchestrator workflows through the Model Context Protocol. Each action enforces the existing Orchestrator RBAC permissions (`orchestrator.workflow`, `orchestrator.workflow.use`, `orchestrator.instanceAdminView`) with full fidelity, including conditional policies and instance ownership checks.
