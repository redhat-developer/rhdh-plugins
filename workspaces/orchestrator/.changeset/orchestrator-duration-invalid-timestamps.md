---
'@red-hat-developer-hub/backstage-plugin-orchestrator-backend': patch
---

Fix the Orchestrator runs list failing with `Invalid unit value NaN` when a workflow run has a missing or invalid `start` timestamp. The duration is now omitted instead of throwing.
