# Scorecard Backend Module for GitLab

This is an extension module to the `backstage-plugin-scorecard-backend` plugin. It provides GitLab-specific metrics for software components registered in the Backstage catalog.

## Prerequisites

Before installing this module, ensure that the Scorecard backend plugin is integrated into your Backstage instance. Follow the [Scorecard backend plugin README](../scorecard-backend/README.md) for setup instructions.

This module also requires a GitLab integration to be configured in your `app-config.yaml`. It uses Backstage's standard GitLab integration configuration, you can check the [docs](https://backstage.io/docs/integrations/gitlab/locations/#configuration) to see all options.

Authentication uses **Backend Service Integration** only: configure a token under `integrations.gitlab` in `app-config.yaml`. **User-Delegated Operations (OAuth / signed-in user tokens) are not supported.**

The GitLab host is resolved from each entity's **source location** (`backstage.io/source-location` or managed-by location) via `getEntitySourceLocation`, not hardcoded to `gitlab.com`. Configure an `integrations.gitlab` entry that matches that host (including self-hosted GitLab).

```yaml
# app-config.yaml — gitlab.com
integrations:
  gitlab:
    - host: gitlab.com
      token: ${GITLAB_TOKEN}
      apiBaseUrl: https://gitlab.com/api/v4

# app-config.yaml — self-hosted example
integrations:
  gitlab:
    - host: gitlab.example.com
      token: ${GITLAB_TOKEN}
      apiBaseUrl: https://gitlab.example.com/api/v4
```

## Installation

To install this backend module:

```bash
# From your root directory
yarn workspace backend add @red-hat-developer-hub/backstage-plugin-scorecard-backend-module-gitlab
```

```ts
// packages/backend/src/index.ts
import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

// Scorecard backend plugin
backend.add(
  import('@red-hat-developer-hub/backstage-plugin-scorecard-backend'),
);

// Install the GitLab module
backend.add(
  import(
    '@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-gitlab'
  ),
);

backend.start();
```

### Entity Annotations

For the GitLab metrics to work, your catalog entities must have the `gitlab.com/project-slug` annotation and a source location pointing at the GitLab project host:

```yaml
# catalog-info.yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  annotations:
    # Required: GitLab project path, e.g. "group/project" or "group/subgroup/project"
    gitlab.com/project-slug: my-group/my-project
    # Required: source location used to resolve the GitLab host / integration
    backstage.io/source-location: url:https://gitlab.com/my-group/my-project/-/tree/main/
spec:
  type: service
  lifecycle: production
  owner: team-a
```

For self-hosted GitLab, point the source location at that host (for example `url:https://gitlab.example.com/my-group/my-project/-/tree/main/`) and configure a matching `integrations.gitlab` entry.

## Available Metrics

| Metric ID                        | Description                                                                   | Type       | Time Window |
| -------------------------------- | ----------------------------------------------------------------------------- | ---------- | ----------- |
| `gitlab.openIssues`              | Currently open issues                                                         | Number     | —           |
| `gitlab.openedIssues7d`          | Issues opened in the last 7 days                                              | Number     | 7 days      |
| `gitlab.closedIssues7d`          | Closed issues updated in the last 7 days (approx. recently closed)            | Number     | 7 days      |
| `gitlab.openMergeRequests`       | Currently open merge requests                                                 | Number     | —           |
| `gitlab.openedMergeRequests7d`   | Merge requests opened in the last 7 days                                      | Number     | 7 days      |
| `gitlab.closedMergeRequests7d`   | Closed/merged MRs updated in the last 7 days (approx. recently closed/merged) | Number     | 7 days      |
| `gitlab.startedPipelines7d`      | Pipelines started in the last 7 days                                          | Number     | 7 days      |
| `gitlab.successfulPipelines7d`   | Successful pipelines in the last 7 days                                       | Number     | 7 days      |
| `gitlab.failedPipelines7d`       | Failed pipelines in the last 7 days                                           | Number     | 7 days      |
| `gitlab.pipelineSuccessRatio7d`  | Pipeline success ratio over the last 7 days                                   | Number (%) | 7 days      |
| `gitlab.pipelineSuccessRatio24h` | Pipeline success ratio over the last 24 hours                                 | Number (%) | 24 hours    |
| `gitlab.startedJobs7d`           | Jobs started in the last 7 days                                               | Number     | 7 days      |
| `gitlab.successfulJobs7d`        | Successful jobs in the last 7 days                                            | Number     | 7 days      |
| `gitlab.failedJobs7d`            | Failed jobs in the last 7 days                                                | Number     | 7 days      |
| `gitlab.jobSuccessRatio7d`       | Job success ratio over the last 7 days                                        | Number (%) | 7 days      |
| `gitlab.jobSuccessRatio24h`      | Job success ratio over the last 24 hours                                      | Number (%) | 24 hours    |

Success ratio metrics are `successful / (successful + failed)` as a percentage. Pending, running, and canceled pipelines/jobs are ignored. When there are no successful or failed items in the window, the ratio is `100`.

Closed issues/MRs (`gitlab.closedIssues7d`, `gitlab.closedMergeRequests7d`) use GitLab `updatedAfter` with `state=closed`/`merged` because GitLab has no `closedAfter` filter. That approximates recently closed items, but also includes closed/merged items that were only commented on, relabeled, or otherwise updated in the window. Exact close-event counts would require the GitLab Events API.

Job counts page through the Jobs API with a default client-side cap of 1000 items per query; when the cap is hit the client logs a warning and returns a truncated count.

## Available Providers

Schedule and threshold overrides in `app-config.yaml` are keyed by the **config key** under `scorecard.metricProviders.gitlab`. That key is the local part of the provider ID (everything after `gitlab.`). Per-metric overrides under `metrics.` use the local metric name (everything after `gitlab.`).

| Provider ID            | Config key      | Metric IDs (local names under `metrics.`)                                                                               |
| ---------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `gitlab.issues`        | `issues`        | `openIssues`, `openedIssues7d`, `closedIssues7d`                                                                        |
| `gitlab.mergeRequests` | `mergeRequests` | `openMergeRequests`, `openedMergeRequests7d`, `closedMergeRequests7d`                                                   |
| `gitlab.pipelines`     | `pipelines`     | `startedPipelines7d`, `successfulPipelines7d`, `failedPipelines7d`, `pipelineSuccessRatio7d`, `pipelineSuccessRatio24h` |
| `gitlab.jobs`          | `jobs`          | `startedJobs7d`, `successfulJobs7d`, `failedJobs7d`, `jobSuccessRatio7d`, `jobSuccessRatio24h`                          |

Prefer per-metric threshold overrides for `pipelines` and `jobs`, because those providers mix lower-is-better counts, higher-is-better success counts, and percentage ratios. A provider-level `thresholds` block applies to every metric from that provider.

## Default thresholds

Lower-is-better count metrics (open issues/MRs, opened/closed windows, started and failed pipelines/jobs) use the default number thresholds:

```yaml
# Equivalent defaults (applied in code when no override is set)
rules:
  - key: success
    expression: '<10'
  - key: warning
    expression: '10-50'
  - key: error
    expression: '>50'
```

Successful pipeline/job counts use higher-is-better thresholds:

```yaml
rules:
  - key: error
    expression: '<10'
  - key: warning
    expression: '10-50'
  - key: success
    expression: '>50'
```

Pipeline and job success ratio metrics use:

```yaml
rules:
  - key: error
    expression: '<50'
  - key: warning
    expression: '50-80'
  - key: success
    expression: '>80'
```

## Configuration

### Threshold Configuration

Thresholds define conditions that determine which category a metric value belongs to (`error`, `warning`, or `success`). Override them per provider (config key from the table above) or per metric (local metric name under `metrics.`):

```yaml
# app-config.yaml
scorecard:
  metricProviders:
    gitlab:
      # Provider-level: applies to all metrics from gitlab.issues
      issues:
        thresholds:
          rules:
            - key: success
              expression: '<5'
            - key: warning
              expression: '5-20'
            - key: error
              expression: '>20'
      # Metric-level: overrides only gitlab.pipelineSuccessRatio7d
      pipelines:
        metrics:
          pipelineSuccessRatio7d:
            thresholds:
              rules:
                - key: error
                  expression: '<70'
                - key: warning
                  expression: '70-90'
                - key: success
                  expression: '>90'
```

See [threshold configuration](../scorecard-backend/docs/thresholds.md) for details.

### Schedule Configuration

The Scorecard plugin uses Backstage's built-in scheduler service to automatically collect metrics from all registered providers every hour by default. You can change the schedule per provider (config key from the table above) in `app-config.yaml`:

```yaml
scorecard:
  metricProviders:
    gitlab:
      issues:
        schedule:
          frequency:
            cron: '0 6 * * *'
          timeout:
            minutes: 5
          initialDelay:
            seconds: 5
```

Use the same `schedule` block under `mergeRequests`, `pipelines`, or `jobs` for those providers.

The schedule configuration follows Backstage's `SchedulerServiceTaskScheduleDefinitionConfig` [schema](https://github.com/backstage/backstage/blob/master/packages/backend-plugin-api/src/services/definitions/SchedulerService.ts#L157). See [Metric Collection Scheduling](../scorecard-backend/docs/providers.md#metric-collection-scheduling) for more details.
