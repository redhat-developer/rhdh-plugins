---
'@red-hat-developer-hub/backstage-plugin-x2a-backend': minor
---

Implemented Job Resource with Kubernetes integration, including:

- Job database table with phase tracking and project/module associations
- REST API endpoints for running init/analyze/migrate/publish phases
- Kubernetes Job and Secret resource management via KubeService
- Two-secret architecture for project and job credentials
- Configuration support via app-config.yaml with environment variable substitution
- Default LLM_MODEL fallback constant
