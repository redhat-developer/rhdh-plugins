---
'@red-hat-developer-hub/backstage-plugin-scorecard-common': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-node': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-dora': minor
---

Adds new endpoint `GET /metrics/:metricId/collectors` to list collector id and description for a metric. Composite metrics (like DORA) set optional `collectorIds` on `Metric` from config.

**BREAKING**: `ScorecardCollectorsService` now includes `getCollectorMetadata`. The default implementation behind `scorecardCollectorsServiceRef` already provides it, so no change is required unless you registered your own factory for that ref — then implement the new method.
