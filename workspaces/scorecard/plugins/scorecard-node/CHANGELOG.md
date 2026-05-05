# @red-hat-developer-hub/backstage-plugin-scorecard-node

## 2.7.2

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-scorecard-common@2.7.2

## 2.7.1

### Patch Changes

- Updated dependencies [91e724f]
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.7.1

## 2.7.0

### Minor Changes

- bf72ffc: Adds `**average**` as an aggregation KPI type alongside `**statusGrouped**`, with configurable `**options.statusScores**` and optional `**options.thresholds**` (same shape as metric thresholds) for homepage donut coloring against `**averageScore × 100**`, with built-in defaults when omitted.

### Patch Changes

- Updated dependencies [bf72ffc]
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.7.0

## 2.6.0

### Minor Changes

- 4ecaacd: Add support for batch metric providers, allowing a single provider to handle multiple metrics efficiently. Introduce a new backend module for configurable file existence checks (filecheck.\*) that verify whether required files (like README, LICENSE, or CODEOWNERS) are present in a repository.

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-scorecard-common@2.6.0

## 2.5.2

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-scorecard-common@2.5.2

## 2.5.1

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-scorecard-common@2.5.1

## 2.5.0

### Minor Changes

- d706601: Backstage version bump to v1.49.3
- 55226c2: Introduces custom threshold rule icons that can be configured in `app-config.yaml`.

### Patch Changes

- Updated dependencies [d706601]
- Updated dependencies [55226c2]
- Updated dependencies [243ad0a]
- Updated dependencies [c83b206]
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.5.0

## 2.4.0

### Minor Changes

- 7062658: Introduces custom threshold rule keys and colors that can be configured in `app-config.yaml`.

### Patch Changes

- dc5e31a: Added missing @backstage/backend-test-utils devDependency to fix lint error
- Updated dependencies [7062658]
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.4.0

## 2.3.5

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-scorecard-common@2.3.5

## 2.3.4

### Patch Changes

- Updated dependencies [4a3369f]
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.3.4

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
