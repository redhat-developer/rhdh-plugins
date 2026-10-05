---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': patch
---

Exclude metrics disabled via `scorecard.disabledMetrics` or the `scorecard.io/disabled-metrics` entity annotation from `getLatestEntityMetrics`, so stale stored values are no longer shown as scorecard cards after a metric is disabled.
