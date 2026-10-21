---
'@red-hat-developer-hub/backstage-plugin-intelligent-assistant-backend': patch
---

Apply JSON parsing per route so queries use their configured body limit and accept attachments larger than 100 KB.

Check rate limits and permissions before parsing JSON on protected routes.
