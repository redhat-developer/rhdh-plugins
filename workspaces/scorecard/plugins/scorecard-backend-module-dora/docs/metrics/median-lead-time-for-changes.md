# DORA Median Lead Time for Changes

- **Metric ID**: `dora.medianLeadTimeForChanges`
- **Type**: Number
- **Unit**: hours
- **Computation window**: 30 days

Median Lead Time for Changes measures how long changes typically take to move from code to production.

The metric computes lead time for changes from pull request first commit timestamp to production deployment timestamp, then returns the median.
The 30-day window decides which successful production deployments are **in-window** (the deployments whose lead time is scored as the pair _head_).
Deployments are processed as chronological pairs (`previousDeployment` -> `currentDeployment`), and pull requests are resolved for the commit range between those two deployment SHAs.
For each pull request in that range, lead time is `currentDeployment.createdAt - pullRequest.firstCommitAt` in hours.
The result is: `median(leadTimeHours)`.

### Pre-window predecessor

To score the **first** in-window deployment, the metric also loads the latest successful production deployment **before** the window start (`windowFrom`) from the deployments collector.

That predecessor is used only as `baseCommitSha` for pull requests into the first in-window deploy. It is not counted as an in-window scored head.

- Predecessor exists: one in-window successful production deployment is enough to form a pair.
- No predecessor: behavior is unchanged. Two successful production deployments in the 30-day window are still required. With two or more in-window deploys, pairs are formed among those deploys only (the first in-window deploy is only a base for the next pair).

The predecessor lookup is a second deployments-collector call with `from` at `1970-01-01T00:00:00.000Z` and `to` immediately before `windowFrom`, plus optional `fetchItemsLimit` (100). Default GitHub collectors honor that cap and keep the newest in-range rows. If those rows are all failed or non-production, the predecessor is omitted (same as no predecessor). Custom collectors that ignore the cap may return a larger history.

## Scope and limitation

This metric assumes deployments form a single chronological stream for the entity. If deployments from multiple branches or release trains are mixed in the same stream, `previousDeployment` and `currentDeployment` can belong to different branches, which may produce incorrect lead-time pairing and noisy results.

If there is no measurable pair (no predecessor and fewer than two successful production deployments in the window, or no pull requests with a measurable lead time), calculation fails with an error for now.

## Options

Provider-specific settings are under `options`:

```yaml
scorecard:
  metricProviders:
    dora:
      medianLeadTimeForChanges:
        options:
          productionEnvironments:
            - production
            - prod
          collectors:
            deployments:
              id: github:deployments
            deploymentPullRequests:
              id: github:deploymentPullRequests
```

- `productionEnvironments`
  - Default: `['production']`
  - Matching is case-insensitive; a deployment counts if its environment matches **any** configured name
  - Missing/unknown `environment` still counts as production
- `collectors` — see [Collectors](#collectors)

## Default thresholds

Thresholds are applied to the computed value in hours:

- `elite`: `<24`
- `medium`: `24-168`
- `low`: `>168`

Configure thresholds via:

- `scorecard.metricProviders.dora.medianLeadTimeForChanges.thresholds`

## Collectors

DORA module uses [**collectors**](../../../scorecard-backend/docs/collectors.md) - reusable components designed to gather data from various datasources, such as Jira or GitHub. You can create your custom data collector to tailor data collection for your specific setup.

This metric requires two collectors: [Deployments collector](#deployments-collector) and [Pull requests between commits collector](#pull-requests-between-commits-collector).

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

The metric may call this collector twice: once for the 30-day window, and once for the pre-window predecessor range. Extra input fields (for example `fetchItemsLimit`) are allowed; they do not replace `from` / `to`.

Required output:

- `deployments: Array<{ id: string; commitSha: string; environment?: string; createdAt: string; result: 'success' | 'failure' | '' }>`

Ordering requirement:

- `deployments` must be in ascending `createdAt` order (oldest to newest). Order is required because the metric processes adjacent deployment pairs chronologically.

### Pull requests between commits collector

Collects pull requests included in the commit range between two deployments (`baseCommitSha` -> `headCommitSha`) and provides their first commit timestamps for lead-time calculation.

Available pull request collectors:

- `github:deploymentPullRequests` (default)

For more information on the collector above, see collector details in [scorecard-backend-module-github README](../../../scorecard-backend-module-github/README.md).

**Important:** This collector requires that you have `@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-github` installed.

Required entity annotations for default `github:deploymentPullRequests` collector:

```yaml
metadata:
  annotations:
    github.com/project-slug: myorg/my-service
```

#### Pull requests between commits collector contract

Required input:

- `baseCommitSha: string` (non-empty)
- `headCommitSha: string` (non-empty)

Required output:

- `pullRequests: Array<{ id: string; firstCommitAt: string }>`

`firstCommitAt` must be a valid ISO datetime for lead-time calculation.

Collector-specific extra input fields are allowed, but they do not replace required contract fields.

## Collector configuration

### Use default GitHub collectors

- Default, no need to provide configuration.

```yaml
scorecard:
  metricProviders:
    dora:
      medianLeadTimeForChanges:
        options:
          collectors:
            deployments:
              id: github:deployments
            deploymentPullRequests:
              id: github:deploymentPullRequests
```

### Use GitHub workflow runs for deployments

When using workflow runs as the deployments source, provide `workflowName` as extra collector input.

```yaml
scorecard:
  metricProviders:
    dora:
      medianLeadTimeForChanges:
        options:
          collectors:
            deployments:
              id: github:deploymentWorkflowRuns
              input:
                workflowName: deploy.yml
            deploymentPullRequests:
              id: github:deploymentPullRequests
```

### Use custom collectors

```yaml
scorecard:
  metricProviders:
    dora:
      medianLeadTimeForChanges:
        options:
          collectors:
            deployments:
              id: customDatasource:deployments
              input:
                # optional collector-specific extra input
            deploymentPullRequests:
              id: customDatasource:deploymentPullRequests
              input:
                # optional collector-specific extra input
```
