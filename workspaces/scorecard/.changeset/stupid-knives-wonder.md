---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-common': minor
'@red-hat-developer-hub/backstage-plugin-scorecard': minor
---

Rename aggregation KPI type `average` to `weightedStatusScore`.

**Breaking changes**

### App config

- `scorecard.aggregationKPIs.*.type`: `average` → `weightedStatusScore`

### `GET /aggregations/:aggregationId` API

- `metadata.aggregationType`: `average` → `weightedStatusScore`
- `result.averageScore` → `result.weightedStatusScore`
- `result.averageWeightedSum` → `result.weightedStatusSum`
- `result.averageMaxPossible` → `result.weightedStatusMaxPossible`
