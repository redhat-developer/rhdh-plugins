# DORA Change Failure Rate

- **Metric ID**: `dora.changeFailureRate`
- **Type**: Number
- **Unit**: percentage
- **Computation window**: 30 days

Change Failure Rate measures how often production deployments lead to failures that require incident response.

The metric computes the percentage of successful production deployment intervals that contain at least one incident, out of all evaluated successful production deployment intervals.
Only successful production deployments that happen within the metric's 30-day computation window are evaluated.
Deployments are processed as chronological pairs (`deployment` -> `nextDeployment`), and each pair defines an interval:
`[deployment.createdAt, nextDeployment.createdAt)`.

For each interval, if at least one incident has `createdAt` in that interval, the deployment is treated as failed.
The result is: `(deploymentsWithIncidents / evaluatedDeployments) * 100`.

The metric is **deployment-interval based**, not incident-window based: only incidents that fall between two successful production deployments are scored. An incident after the latest successful production deployment in the 30-day window is not counted in that run, even if it was created within the DORA 30-day window. It is attributed in a later DORA calculation to the interval closed by the next successful production deployment (the first deployment that follows).

If fewer than two successful production deployments exist in the window, or there are no evaluable intervals (adjacent deployments share the same `createdAt`), calculation fails with an error.

## Scope and limitation

This metric assumes deployments form a single chronological stream for the entity.
If deployments from multiple branches or release trains are mixed, interval pairing may not reflect actual release flow and can produce noisy change-failure-rate results.

## Options

Provider-specific settings are under `options`:

```yaml
scorecard:
  metricProviders:
    dora:
      changeFailureRate:
        options:
          productionEnvironments:
            - production
            - prod
          collectors:
            deployments:
              id: github:deployments
            incidents:
              id: jira:incidents
```

- `productionEnvironments`
  - Default: `['production']`
  - Matching is case-insensitive; a deployment counts if its environment matches **any** configured name
  - Missing/unknown `environment` still counts as production
- `collectors` — see [Collectors](#collectors)

## Default thresholds

Thresholds are applied to the computed percentage value:

- `elite`: `<5`
- `medium`: `5-15`
- `low`: `>15`

Configure thresholds via:

- `scorecard.metricProviders.dora.changeFailureRate.thresholds`

## Collectors

DORA module uses [**collectors**](../../../scorecard-backend/docs/collectors.md) - reusable components designed to gather data from various datasources, such as Jira or GitHub. You can create your custom data collector to tailor data collection for DORA metrics calculation for your specific setup.

This metric requires two collectors: [Deployments collector](#deployments-collector) and [Incidents collector](#incidents-collector).

### Deployments collector

Collects deployments.

Available deployment collectors:

- `github:deployments` (default)
- `github:deploymentWorkflowRuns`

For more information on the collectors above, see deployment collectors details in [scorecard-backend-module-github README](../../../scorecard-backend-module-github/README.md).

**Important:** These collectors, even the default one, require that you have `@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-github` installed.

#### Deployments collector contract

If you're implementing a custom _Deployments_ collector, it must adhere to the following contract:

Required input:

- `from: string` (ISO datetime)
- `to: string` (ISO datetime)

Required output:

- `deployments: Array<{ id: string; commitSha: string; environment?: string; createdAt: string; result: 'success' | 'failure' | '' }>`

Only deployments with `result: 'success'` are included in the calculation.

Ordering requirement:

- `deployments` must be in ascending `createdAt` order (oldest to newest). Order is required because the metric processes adjacent deployment pairs chronologically.

### Incidents collector

Collects incidents in a time window.

Available incidents collectors:

- `jira:incidents` (default)

For more information on the collector above, see incident collector details in [scorecard-backend-module-jira README](../../../scorecard-backend-module-jira/README.md).

**Important:** This collector requires that you have `@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-jira` installed.

Required entity annotations for the default `jira:incidents` collector:

- `jira/incident-project-key` (preferred), or
- `jira/project-key` (fallback when `jira/incident-project-key` is not set)

Optional incident-only filters:

- `jira/incident-component`
- `jira/incident-label`
- `jira/incident-team`
- `jira/incident-issue-type` (overrides app-config `scorecard.metricProviders.dora.changeFailureRate.options.collectors.incidents.input.issueType`; default issue type is `Incident`)

#### Incidents collector contract

Required input:

- `from: string` (ISO datetime)
- `to: string` (ISO datetime)
- `updatedSince: string` (ISO datetime)

Required output:

- `incidents: Array<{ id: string; createdAt: string; updatedAt: string; resolutionAt: string | null }>`

`createdAt` and `updatedAt` must be valid ISO datetimes.
`resolutionAt` must be `null` for unresolved incidents or a valid ISO datetime for resolved incidents.

Collector-specific extra input fields are allowed, but they do not replace required contract fields.

## Collector configuration

### Use default GitHub and Jira collectors

- Default, no need to provide configuration.

```yaml
scorecard:
  metricProviders:
    dora:
      changeFailureRate:
        options:
          collectors:
            deployments:
              id: github:deployments
            incidents:
              id: jira:incidents
              # Optional: override default Incident issue type
              # input:
              #   issueType: ServiceIncident
```

Updating `issueType` in your configuration creates a new data identity and triggers a full 30-day data refresh.

For more details about the `jira:incidents` collector, see the [scorecard-backend-module-jira README](../../../scorecard-backend-module-jira/README.md).

### Use GitHub workflow runs for deployments

When using workflow runs as the deployments source, provide `workflowName` as extra collector input.

```yaml
scorecard:
  metricProviders:
    dora:
      changeFailureRate:
        options:
          collectors:
            deployments:
              id: github:deploymentWorkflowRuns
              input:
                workflowName: Custom deployment name
            incidents:
              id: jira:incidents
```

Updating `workflowName` in your configuration creates a new data identity and triggers a full 30-day data refresh.

### Use custom collectors

```yaml
scorecard:
  metricProviders:
    dora:
      changeFailureRate:
        options:
          collectors:
            deployments:
              id: customDatasource:deployments
              input:
                # optional collector-specific extra input
            incidents:
              id: customDatasource:incidents
              input:
                # optional collector-specific extra input
```
