---
'@red-hat-developer-hub/plugin-cost-management-backend': minor
'@red-hat-developer-hub/plugin-cost-management-common': minor
'@red-hat-developer-hub/plugin-cost-management': minor
---

Add authorization, input validation, and confirmation dialog for Apply Recommendation workflow.

- New `ros.apply` permission required to execute the Apply Recommendation workflow
- New backend `POST /apply-recommendation` endpoint validates `resourceType` against server-side allowlist and checks `ros.apply` permission before forwarding to Orchestrator
- Workflow execution now routes through the cost-management backend instead of directly to the Orchestrator plugin, enabling server-side authorization and audit logging
- Confirmation dialog added before workflow execution to prevent accidental clicks
