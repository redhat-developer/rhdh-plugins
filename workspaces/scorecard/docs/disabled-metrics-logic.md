# Disabled metrics: when a metric is excluded

A metric is **excluded** (disabled) when `isMetricIdDisabled` returns `true`. The following table describes the result for each combination of app-config and entity annotation.

**Evaluation order:** `scorecard.disabledMetrics` is checked first. If the metric is in that list, it is always excluded and the rest is ignored. Otherwise, `entityAnnotations.disabledMetrics` and the entity annotation are applied.

| `scorecard.disabledMetrics` includes `metricId` | `entityAnnotations.disabledMetrics.enabled` | `entityAnnotations.disabledMetrics.except`  | `scorecard.io/disabled-metrics` entity annotation has `metricId`? | Metric check skipped for `metricId` (not run) |
| ----------------------------------------------- | ------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------- |
| Yes                                             | —                                           | —                                           | —                                                                 | **Yes**                                       |
| No                                              | `false`                                     | ignored                                     | No                                                                | **No**                                        |
| No                                              | `false`                                     | ignored                                     | Yes                                                               | **No** (annotation ignored, forced to run)    |
| No                                              | `true` (or unset)                           | unset / empty / does not include `metricId` | No                                                                | **No**                                        |
| No                                              | `true` (or unset)                           | unset / empty / does not include `metricId` | Yes                                                               | **Yes**                                       |
| No                                              | `true` (or unset)                           | includes `metricId`                         | No                                                                | **No**                                        |
| No                                              | `true` (or unset)                           | includes `metricId`                         | Yes                                                               | **No** (annotation ignored, forced to run)    |

## Summary

- **`scorecard.disabledMetrics`**  
  If the metric ID is in this list, it is always excluded. Entity annotations cannot override.

- **`entityAnnotations.disabledMetrics.enabled = false`**  
  If there are no metrics listed in `scorecard.disabledMetrics`, no metrics will be excluded, it does NOT consider any metric listed in the entities.

- **`entityAnnotations.disabledMetrics.enabled = true`**  
  The `except` list applies: metrics in `except` cannot be excluded by annotation (they always run). Metrics not in `except` can be excluded by the entity annotation. When the key is absent, behavior is the same as `true`.
