---
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant-common': major
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant-backend': major
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant': major
---

Consolidate Intelligent Assistant RBAC permissions into four feature-linked sets: `intelligent-assistant.chat`, `intelligent-assistant.notebooks`, `intelligent-assistant.mcp.tools`, and `intelligent-assistant.skills`. Update backend routes, frontend permission checks, example RBAC policies, and documentation to use the new permission names and exported constants.
