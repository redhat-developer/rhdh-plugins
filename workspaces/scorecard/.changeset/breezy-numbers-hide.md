---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-common': minor
---

Entity time-series API (`GET /metrics/catalog/:kind/:namespace/:name/time-series`) now returns entity-resolved `thresholds` and per-point `thresholdEvaluation` (classified at read time against those current thresholds) so clients can render sparkline legends and chart colors without a separate snapshot call. Threshold evaluation failures are returned in the existing per-point `error` field. When entity threshold resolution fails (e.g. malformed annotation overrides), the response sets `thresholdsError` and omits `thresholds` instead of silently falling back to config/provider defaults; points are left unclassified (`thresholdEvaluation` null).
