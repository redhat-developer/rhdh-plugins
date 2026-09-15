---
'@red-hat-developer-hub/backstage-plugin-scorecard': patch
---

Scalar aggregation KPI cards now use `result.aggregationChartDisplayColor` from the backend instead of re-evaluating threshold expressions on the frontend. Min/max scalar drill-down pages now default-sort the entities table by metric value (ascending for min, descending for max).
