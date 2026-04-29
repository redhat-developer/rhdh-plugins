---
'@red-hat-developer-hub/backstage-plugin-lightspeed': patch
'@red-hat-developer-hub/backstage-plugin-lightspeed-backend': patch
---

Retain Lightspeed chat and tool-call state when the chat UI remounts (for example when switching display mode between embedded and overlay), so the active thread and tool metadata are not dropped while messages are still streaming or before history refetches.
