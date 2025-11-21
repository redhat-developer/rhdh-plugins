---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-github': major
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-jira': major
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': major
'@red-hat-developer-hub/backstage-plugin-scorecard-node': major
---

**BREAKING**: The `thresholdEvaluator` parameter is no longer supported for the `CatalogMetricService` class constructor.

```diff
const catalogMetricService = new CatalogMetricService({
    catalog,
    auth,
    registry: metricProvidersRegistry,
-    thresholdEvaluator: new ThresholdEvaluator(),
    database: dbMetricValues,
});
```

**BREAKING**: The `getLatestEntityMetrics` method in `CatalogMetricService` was changed. After implementing logic to save metric status in the database, the logic that calculated `evaluation` in the method is no longer needed as this information is now taken from the `status` field in the database metric response.

```diff
async getLatestEntityMetrics(
    entityRef: string,
    providerIds?: string[],
    filter?: PermissionCriteria<
      PermissionCondition<string, PermissionRuleParams>
    >,
  ): Promise<MetricResult[]> {

 . . .

- return rawResults.map(({ metric_id, value, error_message, timestamp }) => {
+ return rawResults.map(({ metric_id, value, error_message, timestamp, status }) => {
      const provider = this.registry.getProvider(metric_id);
      const metric = provider.getMetric();
-      let thresholds: ThresholdConfig | undefined;
-      let evaluation: string | undefined;
-      let thresholdError: string | undefined;
-      try {
-        thresholds = this.mergeEntityAndProviderThresholds(
-          entity,
-          provider,
-          metric.type,
-        );
-        if (value === undefined) {
-          thresholdError =
-            'Unable to evaluate thresholds, metric value is missing';
-        } else {
-          evaluation = this.thresholdEvaluator.getFirstMatchingThreshold(
-            value,
-            metric.type,
-            thresholds,
-          );
-        }
-      } catch (e) {
-        thresholdError = stringifyError(e);
-      }
-
-      const isMetricCalcError = error_message || value === undefined;
+        const isMetricCalcError = error_message || value === undefined;
+        const thresholdError =
+          value === undefined
+            ? 'Unable to evaluate thresholds, metric value is missing'
+            : null;
+        const thresholds = mergeEntityAndProviderThresholds(entity, provider);
```

Implemented saving metric `status` to the database. Added logic for saving `status` in the metric puller scheduler.

Added method `getMetricType` to the `MetricProvider` interface and updated the `getMetric` method to use `getMetricType()` instead of hardcoded `type` values.

```diff
export class MyMetricProvider implements MetricProvider {
+  getMetricType(): 'number' {
+    return 'number';
+  }

  getMetric(): Metric<'number'> {
    return {
      id: this.getProviderId(),
      title: 'GitHub open PRs',
      description:
        'Current count of open Pull Requests for a given GitHub repository.',
-      type: 'number',
+      type: this.getMetricType(),
      history: true,
    };
  }
}
```
