# Scorecard Backend Module for GitLab

This is an extension module to the `backstage-plugin-scorecard-backend` plugin. It provides GitLab-specific metrics for software components registered in the Backstage catalog.

## Prerequisites

Before installing this module, ensure that the Scorecard backend plugin is integrated into your Backstage instance. Follow the [Scorecard backend plugin README](../scorecard-backend/README.md) for setup instructions.

This module also requires a GitLab integration to be configured in your `app-config.yaml`. It uses Backstage's standard GitLab integration configuration, you can check the [docs](https://backstage.io/docs/integrations/gitlab/locations/#configuration) to see all options.

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
/* highlight-add-next-line */
backend.add(
  import(
    '@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-gitlab'
  ),
);

backend.start();
```

### Entity Annotations

For the GitLab metrics to work, your catalog entities must have the `gitlab.com/project-slug` annotation:

```yaml
# catalog-info.yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  annotations:
    # Required: GitLab project slug in format "group/project"
    gitlab.com/project-slug: my-group/my-project
spec:
  type: service
  lifecycle: production
  owner: team-a
```

## Available Metrics

| Metric ID | Description | Type | Time Window |
| --- | --- | --- | --- |
| `gitlab.open_issues` | Currently open issues | Number | — |
| `gitlab.opened_issues_7d` | Issues opened in the last 7 days | Number | 7 days |
| `gitlab.closed_issues_7d` | Issues closed in the last 7 days | Number | 7 days |
| `gitlab.open_merge_requests` | Currently open merge requests | Number | — |
| `gitlab.opened_merge_requests_7d` | Merge requests opened in the last 7 days | Number | 7 days |
| `gitlab.closed_merge_requests_7d` | Merge requests closed or merged in the last 7 days | Number | 7 days |
| `gitlab.started_pipelines_7d` | Pipelines started in the last 7 days | Number | 7 days |
| `gitlab.successful_pipelines_7d` | Successful pipelines in the last 7 days | Number | 7 days |
| `gitlab.failed_pipelines_7d` | Failed pipelines in the last 7 days | Number | 7 days |
| `gitlab.pipeline_success_ratio_7d` | Pipeline success ratio over the last 7 days | Number (%) | 7 days |
| `gitlab.pipeline_success_ratio_24h` | Pipeline success ratio over the last 24 hours | Number (%) | 24 hours |
| `gitlab.started_jobs_7d` | Jobs started in the last 7 days | Number | 7 days |
| `gitlab.successful_jobs_7d` | Successful jobs in the last 7 days | Number | 7 days |
| `gitlab.failed_jobs_7d` | Failed jobs in the last 7 days | Number | 7 days |
| `gitlab.job_success_ratio_7d` | Job success ratio over the last 7 days | Number (%) | 7 days |
| `gitlab.job_success_ratio_24h` | Job success ratio over the last 24 hours | Number (%) | 24 hours |

## Configuration

### Threshold Configuration

Thresholds define conditions that determine which category a metric value belongs to (`error`, `warning`, or `success`). You can configure custom thresholds for the GitLab metrics. Check out detailed explanation of [threshold configuration](../scorecard-backend/docs/thresholds.md).

### Schedule Configuration

The Scorecard plugin uses Backstage's built-in scheduler service to automatically collect metrics from all registered providers every hour by default. However, this configuration can be changed in the `app-config.yaml` file. Here is an example of how to do that:

```yaml
scorecard:
  plugins:
    gitlab:
      open_issues:
        schedule:
          frequency:
            cron: '0 6 * * *'
          timeout:
            minutes: 5
          initialDelay:
            seconds: 5
```

The schedule configuration follows Backstage's `SchedulerServiceTaskScheduleDefinitionConfig` [schema](https://github.com/backstage/backstage/blob/master/packages/backend-plugin-api/src/services/definitions/SchedulerService.ts#L157).
