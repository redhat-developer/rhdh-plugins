---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-dora': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-jira': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-node': minor
---

Persist DORA collector data in the database and sync incrementally from the last watermark, so metrics reuse stored deployments, incidents, and pull requests instead of refetching the full window every time.

**BREAKING**: The Jira `jira:incidents` collector contract now requires `updatedSince` (ISO datetime) in the input and `updatedAt` (ISO datetime) on each incident in the output. Custom incident collector implementations must provide these fields.
