---
'@red-hat-developer-hub/backstage-plugin-bulk-import-backend': major
---

Orchestrator import mode now requires short-lived GitHub App installation tokens for `authTokens` and fails closed when only a classic PAT is available. Plugin-to-plugin calls to Orchestrator now use `auth.getPluginRequestToken` instead of forwarding the incoming user bearer token. Operator docs cover App setup, token TTL limits for long-running workflows, GitLab residual risk, RBAC, and deployment hardening.
