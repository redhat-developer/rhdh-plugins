---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-dora': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-github': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-jira': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-common': minor
'@red-hat-developer-hub/backstage-plugin-scorecard': minor
---

Add DORA metrics and a collectors framework for composing datasource data into metrics.

- New `@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-dora` with Deployment Frequency, Median Lead Time for Changes, Mean Time to Restore, and Change Failure Rate
- New data collectors used by DORA: GitHub deployments, deployment workflow runs, and deployment pull requests; Jira incidents
- Metric time-series API `/metrics/catalog/:kind/:namespace/:name/time-series`
- Adds `defaultVisualization` to Metric metadata for sparkline
