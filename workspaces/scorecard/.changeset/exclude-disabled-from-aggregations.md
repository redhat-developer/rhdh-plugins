---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': patch
---

Exclude metrics disabled via `scorecard.disabledMetrics` or the `scorecard.io/disabled-metrics` entity annotation from homepage aggregations, aggregation time series, drill-down tables, and entity metric time series, so stale stored values are no longer shown after a metric is disabled.
