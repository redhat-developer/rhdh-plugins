---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': patch
'@red-hat-developer-hub/backstage-plugin-scorecard-common': patch
'@red-hat-developer-hub/backstage-plugin-scorecard': patch
---

Fix aggregated scorecard widgets view when entities are missing value or metric fetching fails.

Refactor the /metrics/:metricId/catalog/aggregations endpoint to return an object of aggregated metrics instead of an array containing a single object.
