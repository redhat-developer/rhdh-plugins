# @red-hat-developer-hub/backstage-plugin-scorecard-backend-module-dora

## 0.1.0

### Minor Changes

- fea86e8: Adds new endpoint `GET /metrics/:metricId/collectors` to list collector id and description for a metric. Composite metrics (like DORA) set optional `collectorIds` on `Metric` from config.

  **BREAKING**: `ScorecardCollectorsService` now includes `getCollectorMetadata`. The default implementation behind `scorecardCollectorsServiceRef` already provides it, so no change is required unless you registered your own factory for that ref — then implement the new method.

- ff6683f: Add DORA metrics and a collectors framework for composing datasource data into metrics.

  - New `@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-dora` with Deployment Frequency, Median Lead Time for Changes, Mean Time to Restore, and Change Failure Rate
  - New data collectors used by DORA: GitHub deployments, deployment workflow runs, and deployment pull requests; Jira incidents
  - Metric time-series API `/metrics/catalog/:kind/:namespace/:name/time-series`
  - Adds `defaultVisualization` to Metric metadata for sparkline

- f3f71a5: Add unit to metric and display it in threshold legend

### Patch Changes

- Updated dependencies [9c1936e]
- Updated dependencies [fea86e8]
- Updated dependencies [ff6683f]
- Updated dependencies [ecb789b]
- Updated dependencies [f3f71a5]
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@4.3.0
  - @red-hat-developer-hub/backstage-plugin-scorecard-node@4.3.0
