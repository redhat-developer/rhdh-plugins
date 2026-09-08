---
'@red-hat-developer-hub/backstage-plugin-scorecard': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-common': minor
---

Skip scalar aggregation threshold coloring when no successful samples contributed (`total` is 0). Return a null display color and keep the card grey fallback. Scalar aggregation responses now include `aggregationChartDisplayColor` (threshold-derived chart color, or `null` when `total` is 0).

**BREAKING**: Changed types in `scorecard-common` module:

- `WeightedStatusScoreAggregationResult.aggregationChartDisplayColor` widened from `string` to `string | null`.
- `ScalarAggregationResult` gained a required `aggregationChartDisplayColor: string | null` property.

These changes are intentional: the API can return `null` when no samples contribute, and scalar KPI results now expose the same display-color field as weighted status score aggregations.
