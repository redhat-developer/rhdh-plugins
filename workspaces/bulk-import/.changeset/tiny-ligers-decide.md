---
'@red-hat-developer-hub/backstage-plugin-bulk-import': patch
---

Implemented smart polling for import task status in the repository table. Active tasks now poll every 10 seconds for real-time updates, while completed or idle repositories poll every 60 seconds to reduce API load. Polling intervals are aligned to consistent 60-second marks for efficient batching.
