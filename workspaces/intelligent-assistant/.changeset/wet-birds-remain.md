---
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant-backend': major
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant-common': major
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant': major
---

Breaking changes to the permissions model that uses behavior-linked vocabulary rather than CRUD-linked vocabulary:

| Before (Lightspeed)      | Before (Intelligent Assistant)      | After                               |
| ------------------------ | ----------------------------------- | ----------------------------------- |
| `lightspeed.chat.read`   | `intelligent-assistant.chat.read`   | `intelligent-assistant.chat.access` |
| `lightspeed.chat.create` | `intelligent-assistant.chat.create` | `intelligent-assistant.chat.use`    |
| `lightspeed.chat.delete` | `intelligent-assistant.chat.delete` | `intelligent-assistant.chat.manage` |
| `lightspeed.chat.update` | `intelligent-assistant.chat.update` | `intelligent-assistant.chat.manage` |

Changes are applied to `lightspeed` (Frontend), `lightspeed-backend`, and `lightspeed-common` plugins.

Removed permission CRUD action attributes, rbac entries for permission sets now to generic 'use' action, allows `intelligent-assistant.chat.manage` to combine the update and delete actions.

Any hard-coded permission names have been replaced by constants, source references permission names from the permission entities.

`Trans.test.tsx` component test unit has permission names to reflect Intelligent Assistant for RHDH.

Additionally, hard-coded permission names have been replaced by local constants with the new names set.

Plugin documentation changes to revise information to permissions model changes to Intelligent Assistant for RHDH.

Changed permission variable 'lightspeed' prefix to 'ia' to use Intelligent Assistant rebranding.

Changes to example RBAC policy CSV file to reflect Intelligent Assistant for RHDH.
