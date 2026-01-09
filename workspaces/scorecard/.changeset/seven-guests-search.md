---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-common': minor
'@red-hat-developer-hub/backstage-plugin-scorecard': minor
---

Implemented endpoint to aggregate metrics for scorecard metrics

**BREAKING** Update attribute `value` in the `MetricResult` type and update validation to support `null` instead `undefined` for the updated attribute

```diff
export type MetricResult = {
  id: string;
  status: 'success' | 'error';
  metadata: {
    title: string;
    description: string;
    type: MetricType;
    history?: boolean;
  };
  result: {
-    value?: MetricValue;
+    value: MetricValue | null;
    timestamp: string;
    thresholdResult: ThresholdResult;
  };
  error?: string;
};
```

**BREAKING** Update attribute `evaluation` in the `ThresholdResult` type and update validation to support `null` instead `undefined` for the updated attribute

```diff
export type ThresholdResult = {
   status: 'success' | 'error';
-  definition: ThresholdConfig | undefined;
+  definition: ThresholdConfig | null;
   evaluation: string | undefined; // threshold key the expression evaluated to
   error?: string;
};
```
