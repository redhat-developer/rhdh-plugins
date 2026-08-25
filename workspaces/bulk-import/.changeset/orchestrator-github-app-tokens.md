---
'@red-hat-developer-hub/backstage-plugin-bulk-import-backend': major
---

Orchestrator import mode now requires short-lived GitHub App installation tokens for `authTokens` and fails closed when only a classic PAT is available. Operator docs cover App setup, token TTL limits for long-running workflows, GitLab residual risk, RBAC, and deployment hardening.
