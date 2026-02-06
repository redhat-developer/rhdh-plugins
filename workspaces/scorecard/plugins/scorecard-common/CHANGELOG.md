# @red-hat-developer-hub/backstage-plugin-scorecard-common

## 2.3.5

## 2.3.4

### Patch Changes

- 4a3369f: Fix aggregated scorecard widgets view when entities are missing value or metric fetching fails.

  Refactor the /metrics/:metricId/catalog/aggregations endpoint to return an object of aggregated metrics instead of an array containing a single object.

## 2.3.3

## 2.3.2

## 2.3.1

## 2.3.0

### Minor Changes

- 52b60ee: Added aggregated metric cards frontend
- 4e360d5: Implemented endpoint to aggregate metrics for scorecard metrics

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

## 2.2.0

### Minor Changes

- 4c2261f: Backstage version bump to v1.45.2

## 2.1.0

### Minor Changes

- 54465f3: Backstage version bump to v1.44.2

## 2.0.1

## 2.0.0

## 1.0.0

### Major Changes

- 6709132: Release the major version of Scorecard plugin

## 0.1.0

### Minor Changes

- b5ec15c: First version of Scorecard plugin
