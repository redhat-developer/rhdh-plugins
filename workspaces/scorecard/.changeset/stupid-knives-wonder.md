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
