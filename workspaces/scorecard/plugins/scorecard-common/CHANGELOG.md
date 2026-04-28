# @red-hat-developer-hub/backstage-plugin-scorecard-common

## 2.7.0

### Minor Changes

- bf72ffc: Adds `**average**` as an aggregation KPI type alongside `**statusGrouped**`, with configurable `**options.statusScores**` and optional `**options.thresholds**` (same shape as metric thresholds) for homepage donut coloring against `**averageScore × 100**`, with built-in defaults when omitted.

## 2.6.0

## 2.5.2

## 2.5.1

## 2.5.0

### Minor Changes

- d706601: Backstage version bump to v1.49.3
- 55226c2: Introduces custom threshold rule icons that can be configured in `app-config.yaml`.
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

- c83b206: Adds the ability to drill down from aggregated scorecard KPIs to view the individual entities that contribute to the overall score. This enables managers and platform engineers to identify specific services impacting metrics and troubleshoot issues at the entity level.

## 2.4.0

### Minor Changes

- 7062658: Introduces custom threshold rule keys and colors that can be configured in `app-config.yaml`.

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
