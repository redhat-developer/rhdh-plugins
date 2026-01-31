# @red-hat-developer-hub/backstage-plugin-scorecard-node

## 2.3.3

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-scorecard-common@2.3.3

## 2.3.2

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-scorecard-common@2.3.2

## 2.3.1

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-scorecard-common@2.3.1

## 2.3.0

### Patch Changes

- Updated dependencies [52b60ee]
- Updated dependencies [4e360d5]
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.3.0

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

- Updated dependencies [4c2261f]
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.2.0

## 2.1.0

### Minor Changes

- 54465f3: Backstage version bump to v1.44.2

### Patch Changes

- Updated dependencies [54465f3]
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.1.0

## 2.0.1

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-scorecard-common@2.0.1

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

- @red-hat-developer-hub/backstage-plugin-scorecard-common@2.0.0

## 1.0.0

### Major Changes

- 6709132: Release the major version of Scorecard plugin

### Patch Changes

- Updated dependencies [6709132]
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@1.0.0

## 0.1.0

### Minor Changes

- b5ec15c: First version of Scorecard plugin

### Patch Changes

- Updated dependencies [b5ec15c]
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@0.1.0
