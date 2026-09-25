---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-dora': patch
---

Batch DORA deployment, incident, and pull request upserts in groups of 100 within a transaction. This keeps large first-time or stale-window syncs below database parameter limits while ensuring all batches succeed or roll back together.
