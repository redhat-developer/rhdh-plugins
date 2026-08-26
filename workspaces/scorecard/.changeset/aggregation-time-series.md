---
'@red-hat-developer-hub/backstage-plugin-scorecard-common': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': minor
---

Add `GET /aggregations/:aggregationId/time-series` for daily scalar portfolio aggregation (`sum`, `average`, `max`, `min`, `count`). Returns aggregated metric values per UTC days. Days with no data are omitted. Aggregation type `statusGrouped` and `weightedStatusScore` return `400`. Sparkline metrics without a KPI block default to aggregation type `average`.

Adds `metadata.visualization` type to `GET /aggregations/:aggregationId/metadata` response.

**BREAKING**: The `MetricDefaultVisualizationType` type has been removed. Use `ScorecardVisualizationType` instead. Additionally, the default visualization has changed from `'value'` to `'donut'`. The `'value'` option is no longer supported.
