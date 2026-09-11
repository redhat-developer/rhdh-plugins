# Scorecard Backend Module for DORA

This is an extension module to the `backstage-plugin-scorecard-backend` plugin that provides DORA (DevOps Research and Assessment) metrics – key indicators of software delivery performance.

DORA module uses [**collectors**](../scorecard-backend/docs/collectors.md) – reusable components designed to gather data from various datasources, such as Jira or GitHub. You can create your custom data collector to tailor data collection for DORA metrics calculation for your specific setup.

## Prerequisites

Before installing this module, ensure that the Scorecard backend plugin is integrated into your Backstage instance. Follow the [Scorecard backend plugin README](../scorecard-backend/README.md) for setup instructions.

If you use collectors from GitHub and Jira Scorecard modules (default configuration), install the corresponding backend modules so those collectors are registered:

- `@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-github`
- `@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-jira`

## Installation

To install this backend module:

```bash
# From your root directory
yarn workspace backend add @red-hat-developer-hub/backstage-plugin-scorecard-backend-module-dora
```

```ts
// packages/backend/src/index.ts
import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

backend.add(
  import('@red-hat-developer-hub/backstage-plugin-scorecard-backend'),
);

backend.add(
  import(
    '@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-dora'
  ),
);

backend.start();
```

## Available Metrics

| Metric ID                       | Provider ID                     | Unit    | Default thresholds                       | Details                                                                           |
| ------------------------------- | ------------------------------- | ------- | ---------------------------------------- | --------------------------------------------------------------------------------- |
| `dora.deploymentFrequency`      | `dora.deploymentFrequency`      | `/week` | elite `>=7`, medium `1-7`, low `<1`      | [deployment-frequency.md](./docs/metrics/deployment-frequency.md)                 |
| `dora.medianLeadTimeForChanges` | `dora.medianLeadTimeForChanges` | `h`     | elite `<24`, medium `24-168`, low `>168` | [median-lead-time-for-changes.md](./docs/metrics/median-lead-time-for-changes.md) |
| `dora.medianTimeToRestore`      | `dora.medianTimeToRestore`      | `h`     | elite `<1`, medium `1-24`, low `>24`     | [median-time-to-restore.md](./docs/metrics/median-time-to-restore.md)             |
| `dora.changeFailureRate`        | `dora.changeFailureRate`        | `%`     | elite `<5`, medium `5-15`, low `>15`     | [change-failure-rate.md](./docs/metrics/change-failure-rate.md)                   |

## Entity annotations

DORA metric providers run only for entities that include:

```yaml
metadata:
  annotations:
    scorecard.io/dora: 'true'
```

If you use collectors from GitHub and Jira Scorecard modules (default configuration), your entities will also need:

```yaml
metadata:
  annotations:
    github.com/project-slug: myorg/my-service
    jira/incident-project-key: CUSTOM
    # Fallback if no incident-project-key:
    # jira/project-key: CUSTOM
```

> [!IMPORTANT]
> Updating catalog entity annotations _does not_ invalidate stored DORA data. Deployments, incidents, and pull requests are keyed to the `catalog_entity_ref` captured at write time, meaning data persists even if annotations change.

## App configuration

Default, no configration required:

```yaml
scorecard:
  plugins:
    dora:
      productionEnvironments: [production]
      collectors:
        deployments:
          id: github:deployments
          # To use workflow runs collector, comment out `id: github:deployments` and uncomment:
          # id: github:deploymentWorkflowRuns
          # input:
          #   workflowName: My production workflow
        deploymentPullRequests:
          id: github:deploymentPullRequests
        incidents:
          id: jira:incidents
          # input:
          #   issueType: CustomIncident
```

- `productionEnvironments`
  - Default: `['production']`
  - DORA metrics are calculated for deployments to environments specified in `productionEnvironments`
  - Matching is case-insensitive; a deployment counts if its environment matches **any** configured name
  - Missing/unknown `environment` still counts as production
  - Used by Deployment Frequency, Median Lead Time for Changes, and Change Failure Rate
- `collectors.deployments`
  - Collector configuration to gather deployment data
  - Used by Deployment Frequency, Median Lead Time for Changes, and Change Failure Rate
- `collectors.deploymentPullRequests`
  - Collector configuration to gather pull request data linked to deployments
  - Used by Median Lead Time for Changes
- `collectors.incidents`
  - Collector configuration to gather incident data
  - Used by Change Failure Rate and Median Time to Restore

If you use GitHub or Jira collectors, install the corresponding backend modules:

- `@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-github`
- `@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-jira`

> [!IMPORTANT]
> Changing a collector's `id` or `input` values triggers a full 30-day data refresh, as it creates a new data identity.

## DORA collectors

DORA plugin uses [**collectors**](../../scorecard-backend/docs/collectors.md) to gather necessary data for metrics calculation from various sources. See [collectors.md](./docs/collectors.md) for more information.

This modular approach offers significant benefits:

- **Extensibility:** Easily integrate with new data sources beyond GitHub and Jira.
- **Customization:** Tailor data collection to your specific setup and internal tools.
- **Flexibility:** Adapt without modifying the core plugin. Collectors handle specific data retrieval.

## Threshold customization

Thresholds map metric values to visual categories. DORA defaults use `elite`, `medium`, and `low` (see [Available Metrics](#available-metrics)).

You can customize them in two ways (highest priority first):

1. **Entity annotations** — merge with existing rules (same keys only)
2. **App configuration** — replace provider defaults for that metric

See [threshold configuration](../scorecard-backend/docs/thresholds.md) for details.

**App configuration example**:

```yaml
# app-config.yaml
scorecard:
  metricProviders:
    dora:
      deploymentFrequency:
        thresholds:
          rules:
            - key: elite
              expression: '>=5'
            - key: medium
              expression: '1-5'
            - key: low
              expression: '<1'
```

Paths follow `scorecard.metricProviders.dora.<metricProviderName>.thresholds` (update `metricProviderName` to `deploymentFrequency`, `medianLeadTimeForChanges`, `medianTimeToRestore` or `changeFailureRate`).

**Entity annotation example** (overrides selected keys; others keep app-config or defaults):

```yaml
# catalog-info.yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  annotations:
    scorecard.io/dora: 'true'
    # Format: scorecard.io/{metricId}.thresholds.rules.{key}: '{expression}'
    scorecard.io/dora.deploymentFrequency.thresholds.rules.elite: '>=8'
    scorecard.io/dora.deploymentFrequency.thresholds.rules.medium: '1-8'
    scorecard.io/dora.changeFailureRate.thresholds.rules.elite: '<10'
    scorecard.io/dora.changeFailureRate.thresholds.rules.medium: '10-20'
    scorecard.io/dora.changeFailureRate.thresholds.rules.low: '>20'
spec:
  type: service
  lifecycle: production
  owner: team-a
```

## Scheduling

DORA providers follow Scorecard scheduling settings under their metric keys:

- `scorecard.metricProviders.dora.deploymentFrequency.schedule`
- `scorecard.metricProviders.dora.medianLeadTimeForChanges.schedule`
- `scorecard.metricProviders.dora.medianTimeToRestore.schedule`
- `scorecard.metricProviders.dora.changeFailureRate.schedule`

See [providers.md](../scorecard-backend/docs/providers.md#metric-collection-scheduling) for schedule schema and defaults.

## Data retention and staleness

Configure DORA module data retention and collector staleness behavior under `scorecard.plugins.dora`:

```yaml
scorecard:
  plugins:
    dora:
      dataRetentionDays: 365
      staleAfterMs: 60000 # 1 minute
      deploymentLookbackMs: 172800000 # 48 hours
      incidentLookbackMs: 300000 # 5 minutes
```

- `dataRetentionDays`: how long source rows (deployments, incidents, pull requests linked to expired deployments and sync watermarks) are retained before cleanup. Must be at least `30` (the DORA metric computation window). Default: `365`.
- `staleAfterMs`: freshness threshold in milliseconds for deployments and incidents; if the last sync is within this window, those collectors are not refreshed. Must be greater than or equal to `0`. Set to `0` to always refresh. Default: `60000`. Pull request sync is not gated by `staleAfterMs`; PRs are fetched once per deployment when none are stored yet.
- `deploymentLookbackMs`: when refreshing deployments, re-query from `max(windowFrom, lastSync − deploymentLookbackMs)` by `createdAt` so deployments that succeed shortly after the previous lastSync watermark are not missed. Only new succeeded deployments are stored, **existing deployment rows are not updated** as successful deployment (commit SHA, environment, `createdAt`) is considered immutable.
  - Must be greater than or equal to `0` and at most `30` days. Set to `0` for watermark-only incremental refresh. Default: `172800000` (48 hours).
- `incidentLookbackMs`: when refreshing incidents, re-query from `max(windowFrom, lastSync − incidentLookbackMs)` by `updatedAt`, to absorb clock skew between Scorecard and the incident source as well as source-system index lag.
  - Must be greater than or equal to `0` and at most `30` days. Set to `0` for watermark-only incremental refresh. Default: `300000` (5 minutes).

The module schedules a daily background task, `scorecard-dora:cleanup-expired-data`, that deletes deployments, incidents, pull requests linked to expired deployments and sync watermarks older than `dataRetentionDays`.

**Important Considerations Regarding Data Identity and Updates:**

- Changing a collector's `id` or `input` values triggers a full 30-day data refresh, as it creates a new data identity.
- Updating catalog entity annotations _does not_ invalidate stored DORA data. Deployments, incidents, and pull requests are keyed to the `catalog_entity_ref` captured at write time, meaning data persists even if annotations change.
