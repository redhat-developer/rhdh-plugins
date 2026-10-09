---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': patch
'@red-hat-developer-hub/backstage-plugin-scorecard-common': patch
'@red-hat-developer-hub/backstage-plugin-scorecard': patch
---

Correct weighted status score aggregation responses to return the thresholds used to classify
the aggregate score. Drill-down `/metrics/:metricId/catalog/aggregations/entities` responses
now include the underlying metric thresholds used to classify entity statuses. The entity rows
are now consistent with statuses shown on entity scorecard page, while the aggregate card uses
aggregation thresholds for its own scope. Entity-specific threshold annotation overrides can
still affect an individual entity's status, but are not represented by the drill-down response's
shared threshold set.
