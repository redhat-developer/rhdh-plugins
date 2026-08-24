---
'@red-hat-developer-hub/backstage-plugin-scorecard-common': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': minor
---

Add `GET /aggregations/:aggregationId/time-series` for daily scalar portfolio aggregation (`sum`, `average`, `max`, `min`, `count`). The response includes `thresholds` and `aggregationChartDisplayColor` (last point's threshold color for the whole sparkline; `null` if empty). `statusGrouped` and `weightedStatusScore` return `400`. Sparkline metrics without a KPI block default to average.
