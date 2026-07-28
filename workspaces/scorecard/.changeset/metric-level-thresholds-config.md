---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': major
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-github': major
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-jira': major
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-filecheck': major
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-sonarqube': major
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-dependabot': major
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-openssf': major
'@red-hat-developer-hub/backstage-plugin-scorecard-common': major
---

**BREAKING**: Thresholds moved from provider level to metric level. Configuration is restructured to enable thresholds to be defined directly for each metric with fallback options at the datasource and provider levels. The new top-level key `metricProviders` now houses all metric-specific configurations. Schedule options are added to datasource level. Threshold annotation overrides now require full metric ID instead of provider ID.

Thresholds from configuration are determined by the most specific setting. Priority order is: Metric > MetricProvider > Datasource:

1. `plugins.<datasource>.metricProviders.<providerName>.metrics.<metricName>.thresholds`
2. `plugins.<datasource>.metricProviders.<providerName>.thresholds`
3. `plugins.<datasource>.thresholds`

Config keys are local names (no datasource prefix). Single-metric plugins can set thresholds directly under the datasource. Schedules use `plugins.<datasource>.schedule` with optional override at `metricProviders.<provider>.schedule`.

Entity annotations must use the full metric ID:
`scorecard.io/<metricId>.thresholds.rules.<key>` (for example
`scorecard.io/filecheck.readme.thresholds.rules.success`).

If you customized thresholds or schedule under a metric provider, nest that provider under `metricProviders`:

```diff
 scorecard:
   plugins:
     github:
-      openPRs:
+      metricProviders:
+        openPRs:
           thresholds:
             rules:
               - key: success
                 expression: '<10'
               - key: warning
                 expression: '10-50'
               - key: error
                 expression: '>50'
```

Apply the same nesting for other datasources (`jira`, `sonarqube`, `dependabot`, `openssf`, etc.): move `plugins.<datasource>.<providerName>` to `plugins.<datasource>.metricProviders.<providerName>`.
