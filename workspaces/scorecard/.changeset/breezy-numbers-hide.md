---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-common': minor
---

Entity time-series API (`GET /metrics/catalog/:kind/:namespace/:name/time-series`) now returns entity-resolved `thresholds` and per-point `thresholdEvaluation` so clients can render sparkline legends and chart colors without a separate snapshot call.
