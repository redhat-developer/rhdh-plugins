# @red-hat-developer-hub/backstage-plugin-scorecard

## 2.3.2

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-scorecard-common@2.3.2

## 2.3.1

### Patch Changes

- a2c7cce: Fix MUI styling issue
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.3.1

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

### Patch Changes

- 9dee966: Integrated UI with backend aggregated api
- f74564d: Added 'it' and 'ja' i18n translation support and updated 'fr' translations.
- 6318931: Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.12.0`.
- 61d0c34: Updated dependency `@red-hat-developer-hub/backstage-plugin-theme` to `^0.11.0`.
- Updated dependencies [52b60ee]
- Updated dependencies [4e360d5]
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.3.0

## 2.2.0

### Minor Changes

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

- 94050aa: Fixes scorecard conditional permissions and conditional access check for Catalog entity.
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

## 0.2.0

### Minor Changes

- 0478b79: Unify provider IDs

## 0.1.0

### Minor Changes

- fe2fa2d: Add internationalization (i18n) support with German, French and Spanish translations for the Scorecard plugin
- b5ec15c: First version of Scorecard plugin

### Patch Changes

- Updated dependencies [b5ec15c]
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@0.1.0
