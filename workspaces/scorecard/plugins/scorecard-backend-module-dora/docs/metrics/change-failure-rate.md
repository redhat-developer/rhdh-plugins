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

## Default thresholds

Thresholds are applied to the computed percentage value:

- `elite`: `<5`
- `medium`: `5-15`
- `low`: `>15`

Configure thresholds via:

- `scorecard.metricProviders.dora.changeFailureRate.thresholds`

## Collectors

Change Failure Rate requires following collectors to gather necessary data for calculation:

- `deployments`: for deployment data
- `incidents`: for incidents data

For detailed information on configuring these collectors, or for creating custom collectors tailored to your specific setup, see [app configuration](../../README.md#app-configuration) and [collectors.md](../dora-collectors.md).
