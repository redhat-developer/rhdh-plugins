---
'@red-hat-developer-hub/backstage-plugin-npx-skill-connector-backend': minor
---

Enforce Backstage service-to-service authentication on all npx connector
endpoints. Unauthenticated requests to `GET /skills/:sourceId` now return
401 instead of the snapshot payload.
