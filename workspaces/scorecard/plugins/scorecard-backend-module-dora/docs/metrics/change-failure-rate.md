# DORA Change Failure Rate

- **Metric ID**: `dora.changeFailureRate`
- **Type**: Number
- **Unit**: percentage
- **Computation window**: 30 days

Change Failure Rate measures how often production deployments lead to failures that require incident response.

The metric computes the percentage of successful production deployment intervals that contain at least one incident, out of all evaluated successful production deployment intervals.
The 30-day window decides which successful production deployments are **in-window**.
Deployments are processed as chronological pairs (`deployment` -> `nextDeployment`), and each pair defines an interval:
`[deployment.createdAt, nextDeployment.createdAt)`.

For each interval, if at least one incident has `createdAt` in that interval, the deployment is treated as failed.
The result is: `(deploymentsWithIncidents / evaluatedDeployments) * 100`.

### Pre-window predecessor

To attribute incidents that fall **before** the first in-window deployment, the metric also loads the latest successful production deployment **before** the window start (`windowFrom`) from the deployments collector.

That predecessor is the start of the interval that **ends** at the first in-window deploy: `[predecessor.createdAt, firstInWindow.createdAt)`.
When a predecessor exists, incidents are collected from `predecessor.createdAt` (not only from `windowFrom`), so incidents in that leading gap are counted.

- Predecessor exists: one in-window successful production deployment is enough to form that interval.
- No predecessor: behavior is unchanged. Two successful production deployments in the 30-day window are still required, and incident collection starts at `windowFrom`.

The predecessor lookup is a second deployments-collector call with `from` at `1970-01-01T00:00:00.000Z` and `to` immediately before `windowFrom`, plus optional `fetchItemsLimit` (100). Default GitHub collectors honor that cap and keep the newest in-range rows. If those rows are all failed or non-production, the predecessor is omitted. Custom collectors that ignore the cap may return a larger history.

The metric is **deployment-interval based**, not incident-window based: only incidents that fall between two successful production deployments are scored. An incident **after** the latest successful production deployment in the 30-day window is still not counted in that run, even if it was created within the DORA 30-day window. It is attributed in a later DORA calculation to the interval closed by the next successful production deployment (the first deployment that follows).

If there is no measurable interval (no predecessor and fewer than two successful production deployments in the window, or adjacent deployments share the same `createdAt`), calculation fails with an error.

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

The metric may call this collector twice: once for the 30-day window, and once for the pre-window predecessor range. Extra input fields (for example `fetchItemsLimit`) are allowed; they do not replace `from` / `to`.

Required output:

- `deployments: Array<{ id: string; commitSha: string; environment?: string; createdAt: string; result: 'success' | 'failure' | '' }>`

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

When a pre-window predecessor exists, `from` is that deployment's `createdAt` (which can be earlier than the 30-day window start). Otherwise `from` is the window start.

Required output:

- `incidents: Array<{ id: string; createdAt: string; resolutionAt: string | null }>`

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
