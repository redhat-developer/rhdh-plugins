---
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant-backend': minor
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant-common': patch
---

introduced new endpoint to proxy to LCORE /v1/skills endpoint, to be able to list available skills. also the backend endpoint will be gated by the new rbac permission: intelligent-assistant.skills.access
