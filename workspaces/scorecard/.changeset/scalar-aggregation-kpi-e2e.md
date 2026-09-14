---
'@red-hat-developer-hub/backstage-plugin-scorecard-common': patch
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': patch
'@red-hat-developer-hub/backstage-plugin-scorecard': patch
---

Export public `ScalarAggregationType` for scalar aggregation KPI types (`sum`, `average`, `count`, `min`, `max`).

Add legacy app E2E coverage for scalar and statusGrouped homepage aggregation KPI cards, including reusable Playwright registration helpers and legacy homepage widget entries for scalar KPIs.
