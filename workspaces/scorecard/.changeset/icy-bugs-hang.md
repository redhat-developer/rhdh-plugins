---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-openssf': major
---

**BREAKING**: OpenSSF checks are now a single provider, `openssf.securityScorecard`, instead of one provider per check (`openssf.maintained`, `openssf.branchProtection`, and so on). All 18 checks are fetched in one HTTP request.

Metric IDs are unchanged. Catalog annotations that use the full metric ID (`scorecard.io/openssf.maintained.thresholds.rules.<key>`) stay the same.

`schedule` can be set only once, on `securityScorecard`, and applies to every check. Per-check `schedule` blocks are no longer read.

Shared thresholds move to that same provider key. A threshold that applied to only one check moves under `metrics.<metricName>`. If every check used the same rules, keep them only on `securityScorecard.thresholds` and omit `metrics`.

```diff
 scorecard:
   metricProviders:
     openssf:
-      maintained:
-        schedule: ...
-        thresholds: ...
-      branchProtection:
-        schedule: ...
-        thresholds: ...
+      securityScorecard:
+        schedule: ...
+        thresholds: ...
+        metrics:
+          maintained:
+            thresholds: ...
```
