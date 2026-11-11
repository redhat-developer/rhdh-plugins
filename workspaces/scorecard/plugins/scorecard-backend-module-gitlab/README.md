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

| Metric ID                        | Description                                        | Type       | Time Window |
| -------------------------------- | -------------------------------------------------- | ---------- | ----------- |
| `gitlab.openIssues`              | Currently open issues                              | Number     | —           |
| `gitlab.openedIssues7d`          | Issues opened in the last 7 days                   | Number     | 7 days      |
| `gitlab.closedIssues7d`          | Issues closed in the last 7 days                   | Number     | 7 days      |
| `gitlab.openMergeRequests`       | Currently open merge requests                      | Number     | —           |
| `gitlab.openedMergeRequests7d`   | Merge requests opened in the last 7 days           | Number     | 7 days      |
| `gitlab.closedMergeRequests7d`   | Merge requests closed or merged in the last 7 days | Number     | 7 days      |
| `gitlab.startedPipelines7d`      | Pipelines started in the last 7 days               | Number     | 7 days      |
| `gitlab.successfulPipelines7d`   | Successful pipelines in the last 7 days            | Number     | 7 days      |
| `gitlab.failedPipelines7d`       | Failed pipelines in the last 7 days                | Number     | 7 days      |
| `gitlab.pipelineSuccessRatio7d`  | Pipeline success ratio over the last 7 days        | Number (%) | 7 days      |
| `gitlab.pipelineSuccessRatio24h` | Pipeline success ratio over the last 24 hours      | Number (%) | 24 hours    |
| `gitlab.startedJobs7d`           | Jobs started in the last 7 days                    | Number     | 7 days      |
| `gitlab.successfulJobs7d`        | Successful jobs in the last 7 days                 | Number     | 7 days      |
| `gitlab.failedJobs7d`            | Failed jobs in the last 7 days                     | Number     | 7 days      |
| `gitlab.jobSuccessRatio7d`       | Job success ratio over the last 7 days             | Number (%) | 7 days      |
| `gitlab.jobSuccessRatio24h`      | Job success ratio over the last 24 hours           | Number (%) | 24 hours    |

Success ratio metrics are `successful / (successful + failed)` as a percentage. Pending, running, and canceled pipelines/jobs are ignored. When there are no successful or failed items in the window, the ratio is `100`.

The module registers four metric providers (`gitlab.openIssues`, `gitlab.openMergeRequests`, `gitlab.startedPipelines7d`, `gitlab.startedJobs7d`). Schedule and threshold overrides are keyed by those provider names under `scorecard.metricProviders.gitlab`.

## Default thresholds

Count metrics (issues, merge requests, started/successful/failed pipelines and jobs) use the default number thresholds:

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

Thresholds define conditions that determine which category a metric value belongs to (`error`, `warning`, or `success`). You can override them per provider or per metric:

```yaml
# app-config.yaml
scorecard:
  metricProviders:
    gitlab:
      openIssues:
        thresholds:
          rules:
            - key: success
              expression: '<5'
            - key: warning
              expression: '5-20'
            - key: error
              expression: '>20'
      startedPipelines7d:
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

The Scorecard plugin uses Backstage's built-in scheduler service to automatically collect metrics from all registered providers every hour by default. You can change the schedule per provider in `app-config.yaml`:

```yaml
scorecard:
  metricProviders:
    gitlab:
      openIssues:
        schedule:
          frequency:
            cron: '0 6 * * *'
          timeout:
            minutes: 5
          initialDelay:
            seconds: 5
```

Use the same `schedule` block under `openMergeRequests`, `startedPipelines7d`, or `startedJobs7d` to override those providers.

The schedule configuration follows Backstage's `SchedulerServiceTaskScheduleDefinitionConfig` [schema](https://github.com/backstage/backstage/blob/master/packages/backend-plugin-api/src/services/definitions/SchedulerService.ts#L157). See [Metric Collection Scheduling](../scorecard-backend/docs/providers.md#metric-collection-scheduling) for more details.
