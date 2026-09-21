# @red-hat-developer-hub/backstage-plugin-scorecard-backend-module-dora

## 0.2.0

### Minor Changes

- 8c690d2: Median lead time and change failure rate now use the latest successful production deployment before the 30-day window as the boundary for the first in-window deploy.

### Patch Changes

- 2600f2c: Filter DORA deployments by production environment in the database when reading metrics, instead of loading all environments and filtering in memory.
- Updated dependencies [8c690d2]
  - @red-hat-developer-hub/backstage-plugin-scorecard-node@4.4.0
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@4.4.0

## 0.1.1

### Patch Changes

- @red-hat-developer-hub/backstage-plugin-scorecard-common@4.3.1
- @red-hat-developer-hub/backstage-plugin-scorecard-node@4.3.1

## 0.1.0

### Minor Changes

- 485fadb: Persist DORA collector data in the database and sync incrementally from the last watermark, so metrics reuse stored deployments, incidents, and pull requests instead of refetching the full window every time.

  The Jira `jira:doraIncidents` collector contract now requires `updatedSince` (ISO datetime) in the input and `updatedAt` (ISO datetime) on each incident in the output. Custom incident collector implementations must provide these fields.

- fea86e8: Adds new endpoint `GET /metrics/:metricId/collectors` to list collector id and description for a metric. Composite metrics (like DORA) set optional `collectorIds` on `Metric` from config.

  **BREAKING**: `ScorecardCollectorsService` now includes `getCollectorMetadata`. The default implementation behind `scorecardCollectorsServiceRef` already provides it, so no change is required unless you registered your own factory for that ref — then implement the new method.

- a1c3eb3: Updated DORA Mean Time to Restore to Median Time to Restore.
- ff6683f: Add DORA metrics and a collectors framework for composing datasource data into metrics.

  - New `@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-dora` with Deployment Frequency, Median Lead Time for Changes, Mean Time to Restore, and Change Failure Rate
  - New data collectors used by DORA: GitHub deployments, deployment workflow runs, and deployment pull requests; Jira incidents
  - Metric time-series API `/metrics/catalog/:kind/:namespace/:name/time-series`
  - Adds `defaultVisualization` to Metric metadata for sparkline

- f3f71a5: Add unit to metric and display it in threshold legend
- a7a1b4a: Backstage version bump to v1.54.6

### Patch Changes

- 0b16b41: Moved DORA collector and production-environment settings to shared `scorecard.plugins.dora` config.
- f2662b4: Rename DORA-specific collector IDs to make their scope explicit and avoid conflicts with potential future generic collectors:

  - `github:deployments` -> `github:doraDeployments`
  - `github:deploymentWorkflowRuns` -> `github:doraDeploymentWorkflowRuns`
  - `github:deploymentPullRequests` -> `github:doraDeploymentPullRequests`
  - `jira:incidents` -> `jira:doraIncidents`

- Updated dependencies [9c1936e]
- Updated dependencies [2bb0ec5]
- Updated dependencies [485fadb]
- Updated dependencies [befccc2]
- Updated dependencies [c380e6b]
- Updated dependencies [fea86e8]
- Updated dependencies [ff6683f]
- Updated dependencies [ecb789b]
- Updated dependencies [47ac76d]
- Updated dependencies [c7b7410]
- Updated dependencies [f3f71a5]
- Updated dependencies [a7a1b4a]
  - @red-hat-developer-hub/backstage-plugin-scorecard-common@4.3.0
  - @red-hat-developer-hub/backstage-plugin-scorecard-node@4.3.0
