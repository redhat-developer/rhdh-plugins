---
'@red-hat-developer-hub/backstage-plugin-orchestrator-backend': patch
---

Bound the page size of the `list-workflows` and `list-instances` MCP actions (default 50, max 100, with `limit`/`offset` inputs) so they no longer fetch every visible workflow/instance in a single unbounded call. Also cache compiled Ajv validators in the `execute-workflow` action instead of recompiling the workflow's input schema on every invocation.
