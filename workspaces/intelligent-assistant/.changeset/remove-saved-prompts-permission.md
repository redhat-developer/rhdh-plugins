---
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant-common': minor
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant-backend': minor
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant': minor
---

Removed public `iaSavedPromptsManagePermission` from the common package. Saved-prompts backend routes now require `intelligent-assistant.chat.use`. Operators should drop `intelligent-assistant.saved-prompts.manage` from RBAC CSVs; `chat.use` is enough.
