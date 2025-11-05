---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-github': major
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-jira': major
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': major
'@red-hat-developer-hub/backstage-plugin-scorecard-node': major
'@red-hat-developer-hub/backstage-plugin-scorecard': major
---

**BREAKING**: The `supportsEntity` function has been replaced with `getCatalogFilter` for `MetricProvider`. The new function returns a catalog filter instead of taking an entity parameter and returning a boolean. This allows the plugin to query the catalog for entities that support the metric provider.

These changes are **required** to your `MyMetricProvider`:

```diff
export class MyMetricProvider implements MetricProvider {

-  supportsEntity(entity: Entity): boolean {
-    return entity.metadata.annotations?.['my/annotation'] !== undefined;
-  }
+  getCatalogFilter(): Record<string, string | symbol | (string | symbol)[]> {
+    return {
+      'metadata.annotations.my/annotation': CATALOG_FILTER_EXISTS,
+    };
+  }
```

Implemented database support. Implemented scheduler to fetch metrics by provider and to cleanup outdated metrics from database.
