# DORA Deployment Frequency

- **Metric ID**: `dora.deploymentFrequency`
- **Type**: Number
- **Unit**: deployments per week
- **Computation window**: 30 days

Deployment Frequency measures how often a team successfully deploys changes to production.

The metric counts successful deployments to production (or unknown environment) over the last 30 days and normalizes that count to weekly frequency.
The result is: `(successfulProductionDeployments / 30) * 7`.

If there are no successful production deployments in the window, the metric returns `0`.

## Options

Provider-specific settings are under `options`:

```yaml
scorecard:
  metricProviders:
    dora:
      deploymentFrequency:
        options:
          productionEnvironments:
            - production
            - prod
          collectors:
            deployments:
              id: github:deployments
```

- `productionEnvironments`
  - Default: `['production']`
  - Matching is case-insensitive; a deployment counts if its environment matches **any** configured name
  - Missing/unknown `environment` still counts as production
- `collectors` — see [Collectors](#collectors)

## Default thresholds

Thresholds are applied to the computed `deployments/week` value:

- `elite`: `>=7`
- `medium`: `1-7`
- `low`: `<1`

Configure thresholds via:

- `scorecard.metricProviders.dora.deploymentFrequency.thresholds`

## Collectors

DORA module uses [**collectors**](../../../scorecard-backend/docs/collectors.md) – reusable components designed to gather data from various datasources, such as Jira or GitHub. You can create your custom data collector to tailor data collection for your specific setup.

This metric requires [deployments collector](#deployments-collector).

### Deployments collector

Collects deployments.

Available deployment collectors:

- `github:deployments` (default)
- `github:deploymentWorkflowRuns`

For more information on the collectors above, see deployment collectors details in [scorecard-backend-module-github README](../../../scorecard-backend-module-github/README.md).

**Important:** These collectors, even the default one, require that you have `@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-github` installed.

Required entity annotations for default GitHub deployment collectors:

```yaml
metadata:
  annotations:
    github.com/project-slug: myorg/my-service
```

#### Deployments collector contract

If you're implementing a custom _Deployments_ collector, it must adhere to the following contract:

Required input:

- `from: string` (ISO datetime)
- `to: string` (ISO datetime)

Required output:

- `deployments: Array<{ id: string; commitSha: string; environment?: string; createdAt: string; result: 'success' | 'failure' | '' }>`

Only deployments with `result: 'success'` are included in the calculation.

## Collector configuration

### Use GitHub deployments collector (default)

- Default, no need to provide configuration.

```yaml
scorecard:
  metricProviders:
    dora:
      deploymentFrequency:
        options:
          collectors:
            deployments:
              id: github:deployments
```

### Use GitHub deployment workflow runs collector

When using workflow runs, provide `workflowName` as extra collector input.

```yaml
scorecard:
  metricProviders:
    dora:
      deploymentFrequency:
        options:
          collectors:
            deployments:
              id: github:deploymentWorkflowRuns
              input:
                workflowName: Custom deployment
```

Updating `workflowName` in your configuration creates a new data identity and triggers a full 30-day data refresh.

### Use custom deployments collector

```yaml
scorecard:
  metricProviders:
    dora:
      deploymentFrequency:
        options:
          collectors:
            deployments:
              id: customDatasource:deployments
              input:
                # optional collector-specific extra input
```
