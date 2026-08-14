---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-dora': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-jira': minor
---

Persist DORA collector data in the database and sync incrementally from the last watermark, so metrics reuse stored deployments, incidents, and pull requests instead of refetching the full window every time.
