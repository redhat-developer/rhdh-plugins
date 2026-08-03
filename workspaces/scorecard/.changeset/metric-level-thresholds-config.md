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

**BREAKING**: Scorecard provider configuration now lives under top-level `scorecard.metricProviders` instead of `scorecard.plugins`. Provider IDs must be `<datasource>.<providerName>` (no longer equal to the datasource alone). Entity annotations for thresholds use now the full metric ID instead of provider ID.

Thresholds from configuration are determined by the most specific setting (**metric > provider**):

1. `metricProviders.<datasource>.<providerName>.metrics.<metricName>.thresholds`
2. `metricProviders.<datasource>.<providerName>.thresholds`

Config keys are local names (no datasource prefix). Entity annotations use the full metric ID:
`scorecard.io/<metricId>.thresholds.rules.<key>`.

Filecheck provider ID is now `filecheck.fileExistence`; files move under `options`:

```diff
 scorecard:
-  plugins:
-    filecheck:
-      files:
-        license: LICENSE
-        codeowners: CODEOWNERS
-      thresholds: ...
-      schedule: ...
+  metricProviders:
+    filecheck:
+      fileExistence:
+        options:
+          files:
+            license: LICENSE
+            codeowners: CODEOWNERS
+        thresholds: ...
+        schedule: ...
```

Migration from the previous `scorecard.plugins` layout:

```diff
 scorecard:
-  plugins:
+  metricProviders:
     github:
       openPRs:
         schedule: ...
         thresholds: ...
```
