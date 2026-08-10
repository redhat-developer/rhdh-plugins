# Scorecard Backend Module for DORA

This is an extension module to the `backstage-plugin-scorecard-backend` plugin that provides DORA (DevOps Research and Assessment) metrics – key indicators of software delivery performance.

DORA module uses [**collectors**](../scorecard-backend/docs/collectors.md) – reusable components designed to gather data from various datasources, such as Jira or GitHub. You can create your custom data collector to tailor data collection for DORA metrics calculation for your specific setup.

## Prerequisites

Before installing this module, ensure that the Scorecard backend plugin is integrated into your Backstage instance. Follow the [Scorecard backend plugin README](../scorecard-backend/README.md) for setup instructions.

If you use built-in collectors from GitHub and Jira modules, install the corresponding backend modules so those collectors are registered:

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

### Entity annotations

DORA metric providers run only for entities that include:

```yaml
metadata:
  annotations:
    scorecard.io/dora: 'true'
```

## Available Metrics

| Metric ID                       | Provider ID                     | Default thresholds                                     | Details                                                                           |
| ------------------------------- | ------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------- |
| `dora.deploymentFrequency`      | `dora.deploymentFrequency`      | elite `>=7`, medium `1-7`, low `<1` (deployments/week) | [deployment-frequency.md](./docs/metrics/deployment-frequency.md)                 |
| `dora.medianLeadTimeForChanges` | `dora.medianLeadTimeForChanges` | elite `<24`, medium `24-168`, low `>168` (hours)       | [median-lead-time-for-changes.md](./docs/metrics/median-lead-time-for-changes.md) |
| `dora.meanTimeToRestore`        | `dora.meanTimeToRestore`        | elite `<1`, medium `1-24`, low `>24` (hours)           | [mean-time-to-restore.md](./docs/metrics/mean-time-to-restore.md)                 |
| `dora.changeFailureRate`        | `dora.changeFailureRate`        | elite `<5`, medium `5-15`, low `>15` (%)               | [change-failure-rate.md](./docs/metrics/change-failure-rate.md)                   |

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
  plugins:
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

Paths follow `scorecard.plugins.dora.<metricProviderName>.thresholds` (update `metricProviderName` to `deploymentFrequency`, `medianLeadTimeForChanges`, `meanTimeToRestore` or `changeFailureRate`).

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

## Use your own collectors

You can replace default collector IDs via `app-config.yaml` as long as your collectors implement the schema contracts expected by each metric:

- `dora.deploymentFrequency` [collector contracts](./docs/metrics/deployment-frequency.md#collectors)
- `dora.medianLeadTimeForChanges` [collector contracts](./docs/metrics/median-lead-time-for-changes.md#collectors)
- `dora.meanTimeToRestore` [collector contracts](./docs/metrics/mean-time-to-restore.md#collectors)
- `dora.changeFailureRate` [collector contracts](./docs/metrics/change-failure-rate.md#collectors)

Collector inputs are merged with provider-generated required inputs. This lets you pass extra collector-specific fields (for example `workflowName` when using a workflow-runs based collector) as long as required contract fields are still supported.

```yaml
scorecard:
  plugins:
    dora:
      deploymentFrequency:
        options:
          productionEnvironments: [production, prod]
          collectors:
            deployments:
              id: customDatasource:deployments
              input:
                # merged with generated from/to window
                # your collector-specific options
      medianLeadTimeForChanges:
        options:
          productionEnvironments: [production, prod]
          collectors:
            deployments:
              id: customDatasource:deployments
              input:
                # merged with generated from/to window
            deploymentPullRequests:
              id: customDatasource:deploymentPullRequests
              input:
                # merged with generated baseCommitSha/headCommitSha
```

## Scheduling

DORA providers follow Scorecard scheduling settings under their metric keys:

- `scorecard.plugins.dora.deploymentFrequency.schedule`
- `scorecard.plugins.dora.medianLeadTimeForChanges.schedule`
- `scorecard.plugins.dora.meanTimeToRestore.schedule`
- `scorecard.plugins.dora.changeFailureRate.schedule`

See [providers.md](../scorecard-backend/docs/providers.md#metric-collection-scheduling) for schedule schema and defaults.
