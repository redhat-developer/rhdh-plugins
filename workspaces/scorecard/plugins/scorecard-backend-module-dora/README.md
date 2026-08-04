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

Override default thresholds in `app-config.yaml` under `scorecard.plugins.dora.<metricName>.thresholds` (for example `deploymentFrequency` or `medianLeadTimeForChanges`). See [threshold configuration](../scorecard-backend/docs/thresholds.md).

## Use your own collectors

You can replace default collector IDs via `app-config.yaml` as long as your collectors implement the schema contracts expected by each metric:

- `dora.deploymentFrequency` [collector contracts](./docs/metrics/deployment-frequency.md#collectors)
- `dora.medianLeadTimeForChanges` [collector contracts](./docs/metrics/median-lead-time-for-changes.md#collectors)

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

See [providers.md](../scorecard-backend/docs/providers.md#metric-collection-scheduling) for schedule schema and defaults.
