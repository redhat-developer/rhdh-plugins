# DORA Deployment Frequency

- **Metric ID**: `dora.deploymentFrequency`
- **Type**: Number
- **Unit**: deployments per week
- **Computation window**: 30 days

Deployment Frequency measures how often a team successfully deploys changes to production.

The metric counts successful deployments to production (or unknown environment) over the last 30 days and normalizes that count to weekly frequency.
The result is: `(successfulProductionDeployments / 30) * 7`.

If there are no successful production deployments in the window, the metric returns `0`.

## Default thresholds

Thresholds are applied to the computed `deployments/week` value:

- `elite`: `>=7`
- `medium`: `1-7`
- `low`: `<1`

Configure thresholds via:

- `scorecard.metricProviders.dora.deploymentFrequency.thresholds`

## Collectors

Deployment Frequency requires following collectors to gather necessary data for calculation:

- `deployments`: for deployment data

For detailed information on configuring this collector, or for creating custom collectors tailored to your specific setup, see [app configuration](../../README.md#app-configuration) and [collectors.md](../dora-collectors.md).
