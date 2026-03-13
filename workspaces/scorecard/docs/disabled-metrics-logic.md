# Disabled metrics: when a metric is excluded

A metric is **excluded** (disabled) when `isMetricIdDisabled` returns `true`. The following table describes the result for each combination of app-config and entity annotation.

**Evaluation order:** `scorecard.disabledMetrics` is checked first. If the metric is in that list, it is always excluded and the rest is ignored. Otherwise, `entityAnnotations.disabledMetrics` and the entity annotation are applied.

| `scorecard.disabledMetrics` | `entityAnnotations.disabledMetrics.enabled` | `entityAnnotations.disabledMetrics.except` | Entity annotation lists this metric? | **Metric excluded?** |
| --------------------------- | ------------------------------------------- | ------------------------------------------ | ------------------------------------ | -------------------- |
| this metric **in** list     | —                                           | —                                          | —                                    | **Yes**              |
| this metric not in list     | `false`                                     | ignored                                    | Yes                                  | **Yes**              |
| this metric not in list     | `false`                                     | ignored                                    | No                                   | **No**               |
| this metric not in list     | `true`                                      | null or empty                              | Yes                                  | **Yes**              |
| this metric not in list     | `true`                                      | null or empty                              | No                                   | **No**               |
| this metric not in list     | `true`                                      | contains this metric                       | Yes                                  | **No** (must run)    |
| this metric not in list     | `true`                                      | contains this metric                       | No                                   | **No**               |
| this metric not in list     | `true`                                      | contains other metric(s), not this one     | Yes                                  | **Yes**              |
| this metric not in list     | `true`                                      | contains other metric(s), not this one     | No                                   | **No**               |

## Summary

- **`scorecard.disabledMetrics`**  
  If the metric ID is in this list, it is always excluded. Entity annotations cannot override.

- **`entityAnnotations.disabledMetrics.enabled = false`**  
  The `except` list is not used. Only the entity annotation is considered: if the entity lists this metric in `scorecard.io/disabled-metrics`, the metric is excluded; otherwise it is not.

- **`entityAnnotations.disabledMetrics.enabled = true`**  
  The `except` list applies: metrics in `except` cannot be excluded by annotation (they always run). Metrics not in `except` can be excluded by the entity annotation. When the key is absent, behavior is the same as `true`.
