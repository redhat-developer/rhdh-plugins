---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': major
'@red-hat-developer-hub/backstage-plugin-scorecard-common': major
'@red-hat-developer-hub/backstage-plugin-scorecard': major
---

**BREAKING**: Rename aggregation KPI type `average` to `weightedStatusScore`.

### App config

- `scorecard.aggregationKPIs.*.type`: `average` → `weightedStatusScore`

### `GET /aggregations/:aggregationId` API

- `metadata.aggregationType`: `average` → `weightedStatusScore`
- `result.averageScore` → `result.weightedStatusScore`
- `result.averageWeightedSum` → `result.weightedStatusSum`
- `result.averageMaxPossible` → `result.weightedStatusMaxPossible`

### Frontend translations (`metric.*`)

Update any scorecard translation overrides that used the old `average*` keys:

- `metric.averageCenterTooltipTotalLabel` → `metric.weightedStatusScoreCenterTooltipTotalLabel`
- `metric.averageCenterTooltipMaxLabel` → `metric.weightedStatusScoreCenterTooltipMaxLabel`
- `metric.averageCenterTooltipBreakdownRow_one` / `_other` → `metric.weightedStatusScoreCenterTooltipBreakdownRow_one` / `_other`
- `metric.averageLegendTooltipEntitiesEach_one` / `_other` → `metric.weightedStatusScoreLegendTooltipEntitiesEach_one` / `_other`
- `metric.averageLegendTooltipRowTotal` → `metric.weightedStatusScoreLegendTooltipRowTotal`

The `averageLegendTooltip*` keys served the removed side-legend tooltip; the center donut tooltip uses the `weightedStatusScoreCenterTooltip*` keys (including per-status breakdown rows).

### UI `data-testid` values

Update downstream e2e selectors that targeted the weighted-status-score card center label:

- `average-card-center-percent` → `weighted-status-score-card-center-percent`
- `average-card-center-percent-hit-area` → `weighted-status-score-card-center-percent-hit-area`
