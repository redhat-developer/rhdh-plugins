---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-node': minor
---

Introduce `scorecardCollectorsExtensionPoint` for registering collectors to fetch data from different datasources, and `scorecardCollectorsServiceRef` for consuming collected data in metric providers `calculateMetrics` through `collect(...)`.
