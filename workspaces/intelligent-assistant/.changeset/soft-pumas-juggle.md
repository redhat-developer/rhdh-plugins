---
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant-backend': major
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant-common': major
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant': major
---

Breaking changes to the notebooks permissions model that uses behavior-linked vocabulary:

| Before (Lightspeed)        | Before (Intelligent Assistant)        | After                                    |
| -------------------------- | ------------------------------------- | ---------------------------------------- |
| `lightspeed.notebooks.use` | `intelligent-assistant.notebooks.use` | `intelligent-assistant.notebooks.use`    |
|                            |                                       | `intelligent-assistant.notebooks.manage` |

- `notebooks.use` covers list/read/create session, upload document, and query endpoints
- `notebooks.manage` covers update/delete session and document endpoints

Removed permission CRUD action attributes; RBAC entries for notebooks permission sets now use the generic `use` action.

Hard-coded permission names were replaced by constants from the permission entities.

Plugin documentation and example RBAC policy CSV updated to reflect the notebooks permission model.
