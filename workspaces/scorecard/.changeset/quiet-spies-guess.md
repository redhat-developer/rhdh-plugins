---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-common': minor
---

Select one time-series point per UTC day in the database and include error-only days in the response.

- Prefer the latest successful sample each day; if a day has only calculation failures, return the latest error as `value: null` with `error`
- Widen `MetricTimeSeriesPoint` so `value` may be null and `error` is optional
