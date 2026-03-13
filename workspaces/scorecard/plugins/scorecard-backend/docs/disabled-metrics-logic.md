# Disabled metrics: when a metric check is skipped (not executed)

Administrators can disable metric checks globally via app-config, and users can disable them for concrete entity via `scorecard.io/disabled-metrics` annotation. Administrators control whether this annotation is honored in app-config via `scorecard.entityAnnotations.disabledMetrics.enabled` (and can force specific checks to always run via `scorecard.entityAnnotations.disabledMetrics.except`). When a metric check is skipped, no data is fetched and the metric is not calculated.
**Evaluation order:** `scorecard.disabledMetrics` is checked first. If the metric ID is in that list, the metric check is always skipped and the rest is ignored. Otherwise, `entityAnnotations.disabledMetrics` in app-config and the entity annotations are applied.
The following table describes the result for each combination of app-config and entity annotation.
| `scorecard.disabledMetrics` includes `metricId` | `entityAnnotations.disabledMetrics.enabled` | `entityAnnotations.disabledMetrics.except` | `scorecard.io/disabled-metrics` entity annotation has `metricId`? | Metric check skipped for `metricId` (not run) |
| ----------------------------------------------- | ------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------- |
| Yes | — | — | — | **Yes** |
| No | `false` | ignored | No | **No** |
| No | `false` | ignored | Yes | **No** (annotation ignored, forced to run) |
| No | `true` (or unset) | unset / empty / does not include `metricId` | No | **No** |
| No | `true` (or unset) | unset / empty / does not include `metricId` | Yes | **Yes** |
| No | `true` (or unset) | includes `metricId` | No | **No** |
| No | `true` (or unset) | includes `metricId` | Yes | **No** (annotation ignored, forced to run) |

## Summary

- **`scorecard.disabledMetrics`**  
  If the metric ID is in this list, the metric check is always skipped (not executed). Entity annotations cannot override.
- **`entityAnnotations.disabledMetrics.enabled = false`**
  Users cannot disable metrics by `scorecard.io/disabled-metrics` annotation.
  The `except` list is not used.
- **`entityAnnotations.disabledMetrics.enabled = true`**
  Users can disable metrics by `scorecard.io/disabled-metrics` annotation. When the key is absent, behavior is the same as `true`.
  The `except` list applies: metric IDs in `except` cannot have their checks skipped by annotation (they always run). Metrics not in `except` can have their checks skipped by the entity annotation.
