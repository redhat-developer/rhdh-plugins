---
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant-backend': major
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant-common': major
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant': major
---

Breaking changes to MCP permissions using behavior-linked vocabulary rather than CRUD-linked vocabulary:

| Before (Lightspeed)     | Before (Intelligent Assistant)     | After              |
| ----------------------- | ---------------------------------- | ------------------ |
| `lightspeed.mcp.read`   | `intelligent-assistant.mcp.read`   | `mcp.tools.use`    |
| `lightspeed.mcp.manage` | `intelligent-assistant.mcp.manage` | `mcp.tools.manage` |

Removed permission CRUD action attributes; RBAC entries for these permission sets now use the generic `use` action.

Permission variable renamed from `iaMcpReadPermission` to `iaMcpUsePermission`; `iaMcpManagePermission` keeps its name.

Plugin documentation and example RBAC policy CSV updated to reflect the new MCP permission names.
