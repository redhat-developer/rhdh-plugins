# Disabled metrics: when a metric check is skipped (not executed)

Administrators can disable metric checks globally via app-config, and users can disable them for concrete entity via `scorecard.io/disabled-metrics` annotation. Administrators control whether this annotation is honored in app-config via `scorecard.entityAnnotations.enabled` (annotation overrides are globally enabled) or `scorecard.entityAnnotations.disabledMetrics.enabled` (and can force specific checks to always run via `scorecard.entityAnnotations.disabledMetrics.except` if global annotation overrides are enabled). When a metric check is skipped, no data is fetched and the metric is not calculated.

**Evaluation order:** `scorecard.disabledMetrics` is checked first. If the metric ID is in that list, the metric check is always skipped and the rest is ignored. If `scorecard.entityAnnotations.enabled` is `false` (all scorecard entity annotations are ignored) or `scorecard.entityAnnotations.disabledMetrics` is false, users are unable to disable metrics using entity annotations. If enabled, entity annotations for disabled metrics are applied.

The following table describes the result for each combination of app-config and entity annotation.

| `scorecard.disabledMetrics` includes `metricId` | `entityAnnotations.enabled` | `entityAnnotations.disabledMetrics.enabled` | `entityAnnotations.disabledMetrics.except`  | `scorecard.io/disabled-metrics` entity annotation has `metricId`? | Metric check skipped for `metricId` (not run) |
| ----------------------------------------------- | --------------------------- | ------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------- |
| Yes                                             | —                           | —                                           | —                                           | —                                                                 | **Yes**                                       |
| No                                              | `false`                     | —                                           | —                                           | Yes                                                               | **No** (all annotations ignored)              |
| No                                              | `true` (or unset)           | `false`                                     | —                                           | No                                                                | **No**                                        |
| No                                              | `true` (or unset)           | `false`                                     | —                                           | Yes                                                               | **No** (annotation ignored, forced to run)    |
| No                                              | `true` (or unset)           | `true` (or unset)                           | unset / empty / does not include `metricId` | No                                                                | **No**                                        |
| No                                              | `true` (or unset)           | `true` (or unset)                           | unset / empty / does not include `metricId` | Yes                                                               | **Yes**                                       |
| No                                              | `true` (or unset)           | `true` (or unset)                           | includes `metricId`                         | No                                                                | **No**                                        |
| No                                              | `true` (or unset)           | `true` (or unset)                           | includes `metricId`                         | Yes                                                               | **No** (annotation ignored, forced to run)    |

`—`: means this setting is not consulted for that row.

## Summary

- **`scorecard.disabledMetrics`**  
  If the metric ID is in this list, the metric check is always skipped (not executed). Entity annotations cannot override.
- **`entityAnnotations.enabled = false`**  
  All scorecard entity annotations are ignored, including `scorecard.io/disabled-metrics`. The `disabledMetrics.enabled` / `except` settings are not used.
- **`entityAnnotations.disabledMetrics.enabled = false`**
  Users cannot disable metrics by `scorecard.io/disabled-metrics` annotation.
  The `except` list is not used.
- **`entityAnnotations.disabledMetrics.enabled = true`**
  Users can disable metrics by `scorecard.io/disabled-metrics` annotation. When the key is absent, behavior is the same as `true`.
  The `except` list applies: metric IDs in `except` cannot have their checks skipped by annotation (they always run). Metrics not in `except` can have their checks skipped by the entity annotation.
