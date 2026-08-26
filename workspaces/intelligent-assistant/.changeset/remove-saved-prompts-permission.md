---
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant-common': major
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant-backend': major
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant': major
---

Removed public `iaSavedPromptsManagePermission` from the common package. Saved-prompts backend routes now require `intelligent-assistant.chat.use`. Operators should drop `intelligent-assistant.saved-prompts.manage` from RBAC CSVs; `chat.use` is enough.
