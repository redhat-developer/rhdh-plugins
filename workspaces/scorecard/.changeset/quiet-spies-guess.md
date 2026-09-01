---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-common': minor
---

Select one time-series point per UTC day in the database and include error-only days in the response.

- Prefer the latest sample of the day, including calculation errors (`value: null` with `error`)
- Widen `MetricTimeSeriesPoint` so `value` may be null and `error` is optional
