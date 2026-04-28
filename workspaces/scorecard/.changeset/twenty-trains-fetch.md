---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-common': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-node': minor
'@red-hat-developer-hub/backstage-plugin-scorecard': minor
---

Adds `**average**` as an aggregation KPI type alongside `**statusGrouped**`, with configurable `**options.statusScores**` and optional `**options.thresholds**` (same shape as metric thresholds) for homepage donut coloring against `**averageScore × 100**`, with built-in defaults when omitted.
