# DORA Median Time to Restore

- **Metric ID**: `dora.medianTimeToRestore`
- **Type**: Number
- **Unit**: hours
- **Computation window**: 30 days

Median Time to Restore measures how quickly service is restored after incidents occur.

The metric computes median incident recovery time for incidents in the last 30 days.
Only resolved incidents are considered (`resolutionAt` is not `null`).
For each resolved incident, recovery time is `resolutionAt - createdAt` in hours.
The result is: `median(recoveryHours)`.

If there are no incidents, or only unresolved ones, calculation fails with an error.
If resolved incidents exist but none have a measurable recovery time (for example `resolutionAt` before `createdAt`), calculation fails with an error.

## Default thresholds

Thresholds are applied to the computed value in hours:

- `elite`: `<1`
- `medium`: `1-24`
- `low`: `>24`

Configure thresholds via:

- `scorecard.metricProviders.dora.medianTimeToRestore.thresholds`

## Collectors

Median Time to Restore requires following collectors to gather necessary data for calculation:

- `incidents`: for incidents data

For detailed information on configuring this collector, or for creating custom collectors tailored to your specific setup, see [app configuration](../../README.md#app-configuration) and [collectors.md](../dora-collectors.md).
