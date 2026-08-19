---
'@red-hat-developer-hub/backstage-plugin-scorecard-common': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-node': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-dora': minor
---

Adds new endpoint `GET /metrics/:metricId/collectors` to list collector id and description for a metric. Composite metrics (like DORA) set optional `collectorIds` on `Metric` from config.

Adds `getCollectorMetadata` to `ScorecardCollectorsService`. The default factory implements it. This interface is consumed via `scorecardCollectorsServiceRef`, a custom replacement of that service needs to add the method.
