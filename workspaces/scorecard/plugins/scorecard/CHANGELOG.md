# @red-hat-developer-hub/backstage-plugin-scorecard

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

- 501e099: Removed Backstage registration requirement for default Scorecard icons
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.5.2

## 2.5.1

### Patch Changes

- f6f7bcf: add threshold-based status colors to entities table
- 0fda0c7: fixed the scorecard-homepage-cards default layout for nfs
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.5.1

## 2.5.0

### Minor Changes

- d706601: Backstage version bump to v1.49.3
- 55226c2: Introduces custom threshold rule icons that can be configured in `app-config.yaml`.
- f13f583: Adding scorecardHomepage and metric page extension, also added e2e support in nfs
- 0d64361: Adds a Scorecard Entities page that allows users to drill down from aggregated scorecard KPIs to view the individual entities contributing to the overall score. The page displays entity-level metric values and status, enabling users to identify services impacting the metric and investigate issues more effectively.
- 243ad0a: Aggregated scorecards now use **aggregation IDs** and dedicated HTTP routes. The old catalog-aggregations URL still works but is **deprecated** (not removed).

  **Backend (`@red-hat-developer-hub/backstage-plugin-scorecard-backend`)**

  - **Deprecated:** `GET /metrics/:metricId/catalog/aggregations` — responses are unchanged, but the handler emits [RFC 8594](https://datatracker.ietf.org/doc/html/rfc8594) `Deprecation` and `Link` headers (alternate successor: `GET .../aggregations/:aggregationId`) and logs a warning. Prefer **`GET /aggregations/:aggregationId`** for new integrations.
  - **Added:** `GET /aggregations/:aggregationId` for aggregated results using configured aggregation.
  - **Added:** `GET /aggregations/:aggregationId/metadata` for KPI titles, descriptions, and aggregation metadata consumed by the UI.

  **Common (`@red-hat-developer-hub/backstage-plugin-scorecard-common`)**

  - Types and constants aligned with the aggregation config and new API shapes.

  **Frontend (`@red-hat-developer-hub/backstage-plugin-scorecard`)**

  - Homepage and aggregated flows resolve cards via **`aggregationId`**, fetch metadata from the new endpoint, and keep localized threshold and error strings where translation keys exist.

  **Action for adopters:** Configure aggregated scorecards with `aggregationId` values that match backend aggregation config, replace direct calls to `GET /metrics/:metricId/catalog/aggregations` with `GET /aggregations/:aggregationId` (and metadata if you need the same labels as the plugin UI).

- 99aa8ff: Added support for the New Frontend System (NFS), including an alpha export for NFS apps and a new `app-next` package.

### Patch Changes

- 6bd7c38: Enable sorting for all other columns in entities table
- ff005a3: add translation for the scorecard entities table status column
- afd7a1e: Update translations for Scorecard.
- 2667f70: Fix scorecard entity table column header Metric to Status
- Updated dependencies [d706601]
- Updated dependencies [55226c2]
- Updated dependencies [243ad0a]
- Updated dependencies [c83b206]
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.5.0

## 2.4.0

### Minor Changes

- 7062658: Introduces custom threshold rule keys and colors that can be configured in `app-config.yaml`.

### Patch Changes

- 10aabb3: Fix tooltip display and error title clipping for some languages
- f6d5102: Translation updated for German and Spanish
- 34fc6c4: Fix Scorecard translations not working in cluster
- Updated dependencies [7062658]
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.4.0

## 2.3.5

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-scorecard-common@2.3.5

## 2.3.4

### Patch Changes

- 4a3369f: Fix aggregated scorecard widgets view when entities are missing value or metric fetching fails.

  Refactor the /metrics/:metricId/catalog/aggregations endpoint to return an object of aggregated metrics instead of an array containing a single object.

- Updated dependencies [4a3369f]
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.3.4

## 2.3.3

### Patch Changes

- abd40c6: add missing translations for it and ja locales
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@2.3.3

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
