---
'@red-hat-developer-hub/backstage-plugin-orchestrator-backend': patch
---

Fixed a crash ("Only user credentials are supported") when the `execute-workflow` MCP action, `list-instances` MCP action, or the `getInstances`/`getInstanceById`/`getWorkflowLogById` REST endpoints were called by a non-user caller, such as an MCP client authenticated via a static `backend.auth.externalAccess` token. These callers now fall back to a fixed system identity (`user:default/system`) for initiator/ownership purposes instead of crashing.
