---
'@red-hat-developer-hub/backstage-plugin-scorecard-common': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': minor
---

Add `GET /aggregations/:aggregationId/time-series` for daily scalar portfolio aggregation (`sum`, `average`, `max`, `min`, `count`). Returns aggregated metric values per UTC days. Days with no data are omitted. Aggregation type `statusGrouped` and `weightedStatusScore` return `400`. Sparkline metrics without a KPI block default to aggregation type `average`.
