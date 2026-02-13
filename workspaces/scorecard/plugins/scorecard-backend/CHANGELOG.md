# @red-hat-developer-hub/backstage-plugin-scorecard-backend

## 2.3.5

### Patch Changes

- ab5f85a: Updated default schedule for pulling metrics to have `initialDelay` of 1 minute
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.3.5
  - @red-hat-developer-hub/backstage-plugin-scorecard-node@2.3.5

## 2.3.4

### Patch Changes

- c964f4f: Fixed an issue when PullMetricsByProviderTask would fail when no entities in Catalog supported metric provider that was processed
- 4a3369f: Fix aggregated scorecard widgets view when entities are missing value or metric fetching fails.

  Refactor the /metrics/:metricId/catalog/aggregations endpoint to return an object of aggregated metrics instead of an array containing a single object.

- Updated dependencies [4a3369f]
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.3.4
  - @red-hat-developer-hub/backstage-plugin-scorecard-node@2.3.4

## 2.3.3

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-scorecard-common@2.3.3
- @red-hat-developer-hub/backstage-plugin-scorecard-node@2.3.3

## 2.3.2

### Patch Changes

- 1f0b3b7: Include the missing config.d.ts files under the files section defined within the package.json
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.3.2
  - @red-hat-developer-hub/backstage-plugin-scorecard-node@2.3.2

## 2.3.1

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-scorecard-common@2.3.1
- @red-hat-developer-hub/backstage-plugin-scorecard-node@2.3.1

## 2.3.0

### Minor Changes

- 23e21ad: Added `metricIds` query parameter to the `/metrics` endpoint to filter metrics by metric IDs.

  Scorecard read permission are no longer needed to get available metrics for the `/metrics` endpoint.

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

### Patch Changes

- Updated dependencies [52b60ee]
- Updated dependencies [4e360d5]
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.3.0
  - @red-hat-developer-hub/backstage-plugin-scorecard-node@2.3.0

## 2.2.0

### Minor Changes

- f8fb8e4: Implemented saving metric `status` to the database. Added logic for saving `status` in the metric puller scheduler.

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

- 4c2261f: Backstage version bump to v1.45.2

### Patch Changes

- Updated dependencies [f8fb8e4]
- Updated dependencies [4c2261f]
  - @red-hat-developer-hub/backstage-plugin-scorecard-node@2.2.0
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.2.0

## 2.1.0

### Minor Changes

- 54465f3: Backstage version bump to v1.44.2

### Patch Changes

- Updated dependencies [54465f3]
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.1.0
  - @red-hat-developer-hub/backstage-plugin-scorecard-node@2.1.0

## 2.0.1

### Patch Changes

- 94050aa: Fixes scorecard conditional permissions and conditional access check for Catalog entity.
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.0.1
  - @red-hat-developer-hub/backstage-plugin-scorecard-node@2.0.1

## 2.0.0

### Major Changes

- 5d447f1: **BREAKING**: The `supportsEntity` function has been replaced with `getCatalogFilter` for `MetricProvider`. The new function returns a catalog filter instead of taking an entity parameter and returning a boolean. This allows the plugin to query the catalog for entities that support the metric provider.

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

### Patch Changes

- Updated dependencies [5d447f1]
  - @red-hat-developer-hub/backstage-plugin-scorecard-node@2.0.0
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.0.0

## 1.0.0

### Major Changes

- 6709132: Release the major version of Scorecard plugin

### Patch Changes

- 26ffba9: Fixed a bug which caused users without entity read access to still be able to view the scorecard metrics for this entity.
- Updated dependencies [6709132]
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@1.0.0
  - @red-hat-developer-hub/backstage-plugin-scorecard-node@1.0.0

## 0.2.0

### Minor Changes

- 0478b79: Unify provider IDs

## 0.1.0

### Minor Changes

- b5ec15c: First version of Scorecard plugin

### Patch Changes

- Updated dependencies [b5ec15c]
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@0.1.0
  - @red-hat-developer-hub/backstage-plugin-scorecard-node@0.1.0
