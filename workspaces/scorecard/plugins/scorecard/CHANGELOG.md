# @red-hat-developer-hub/backstage-plugin-scorecard

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
