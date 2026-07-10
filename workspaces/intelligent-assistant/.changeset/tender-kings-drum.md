---
'@red-hat-developer-hub/backstage-plugin-lightspeed-backend': major
'@red-hat-developer-hub/backstage-plugin-lightspeed-common': major
'@red-hat-developer-hub/backstage-plugin-lightspeed': major
---

Breaking changes to the permissions model that uses behavior-linked vocabulary rather than CRUD-linked vocabulary:

| Before (Lightspeed)      | Before (Intelligent Assistant)      | After                                        |
| ------------------------ | ----------------------------------- | -------------------------------------------- |
| `lightspeed.chat.read`   | `intelligent-assistant.chat.read`   | `intelligent-assistant.conversations.access` |
| `lightspeed.chat.create` | `intelligent-assistant.chat.create` | `intelligent-assistant.chat.use`             |
| `lightspeed.chat.delete` | `intelligent-assistant.chat.delete` | `intelligent-assistant.conversations.manage` |

Changes are applied to `lightspeed` (Frontend), `lightspeed-backend`, and `lightspeed-common` plugins.

Any hard-coded permission names have been replaced by constants, source references permission names from the permission entities.

`Trans.test.tsx` component test unit has permission names to reflect Intelligent Assistant for RHDH.

Additionally, hard-coded permission names have been replaced by local constants with the new names set.

Plugin documentation changes to revise information to permissions model changes to Intelligent Assistant for RHDH.

Changes to example RBAC policy CSV file to reflect Intelligent Assistant for RHDH.
