---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-github': major
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-jira': major
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': major
'@red-hat-developer-hub/backstage-plugin-scorecard-node': major
---

Implemented saving metric `status` to the database. Added logic for saving `status` in the metric puller scheduler.

**BREAKING**: Added method `getMetricType` to the `MetricProvider` interface and updated the `getMetric` method to use `getMetricType()` instead of hardcoded `type` values.

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
