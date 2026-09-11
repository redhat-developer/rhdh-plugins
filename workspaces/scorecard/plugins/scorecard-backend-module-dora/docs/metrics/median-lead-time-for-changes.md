# DORA Median Lead Time for Changes

- **Metric ID**: `dora.medianLeadTimeForChanges`
- **Type**: Number
- **Unit**: hours
- **Computation window**: 30 days

Median Lead Time for Changes measures how long changes typically take to move from code to production.

The metric computes lead time for changes from pull request first commit timestamp to successful production deployment timestamp, then returns the median.
Deployments are processed as chronological pairs of successful production deployments (`previousDeployment` -> `currentDeployment`), and pull requests are resolved for the commit range between those two deployment SHAs.
For each pull request in that range, lead time is `currentDeployment.createdAt - pullRequest.firstCommitAt` in hours.
The result is: `median(leadTimeHours)`.

## Scope and limitation

This metric assumes deployments form a single chronological stream for the entity. If deployments from multiple branches or release trains are mixed in the same stream, `previousDeployment` and `currentDeployment` can belong to different branches, which may produce incorrect lead-time pairing and noisy results.

If fewer than two successful production deployments exist in the window, or no pull requests with a measurable lead time are found between deployments, calculation fails with an error for now.

## Default thresholds

Thresholds are applied to the computed value in hours:

- `elite`: `<24`
- `medium`: `24-168`
- `low`: `>168`

Configure thresholds via:

- `scorecard.metricProviders.dora.medianLeadTimeForChanges.thresholds`

## Collectors

Median Lead Time for Changes requires following collectors to gather necessary data for calculation:

- `deployments`: for deployment data
- `incidents`: for incidents data

For detailed information on configuring these collectors, or for creating custom collectors tailored to your specific setup, see [app configuration](../../README.md#app-configuration) and [collectors.md](../dora-collectors.md).
