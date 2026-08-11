# Scorecard Backend Module for GitHub

This is an extension module to the `backstage-plugin-scorecard-backend` plugin. It provides GitHub-specific metrics for software components registered in the Backstage catalog.

## Prerequisites

Before installing this module, ensure that the Scorecard backend plugin is integrated into your Backstage instance. Follow the [Scorecard backend plugin README](../scorecard-backend/README.md) for setup instructions.

This module also requires a GitHub integration to be configured in your `app-config.yaml`. It uses Backstage's standard GitHub integration configuration, you can check the [docs](https://backstage.io/docs/integrations/github/locations/#configuration) to see all options.

## Installation

To install this backend module:

```bash
# From your root directory
yarn workspace backend add @red-hat-developer-hub/backstage-plugin-scorecard-backend-module-github
```

```ts
// packages/backend/src/index.ts
import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

// Scorecard backend plugin
backend.add(
  import('@red-hat-developer-hub/backstage-plugin-scorecard-backend'),
);

// Install the GitHub module
/* highlight-add-next-line */
backend.add(
  import(
    '@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-github'
  ),
);

backend.start();
```

### Entity Annotations

For the GitHub metrics to work, your catalog entities must have the required GitHub annotations:

```yaml
# catalog-info.yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  annotations:
    # Required: GitHub project slug in format "owner/repository"
    github.com/project-slug: myorg/my-service
spec:
  type: service
  lifecycle: production
  owner: team-a
```

## Available Metrics

### GitHub open PRs (`github.openPRs`)

This metric counts all pull requests that are currently in an "open" state for the repository specified in the entity's `github.com/project-slug` annotation.

- **Metric ID**: `github.openPRs`
- **Metric Provider ID**: `github.openPRs`
- **Type**: Number
- **Datasource**: `github`
- **Unit**: open pull requests (count)

## Collectors

This module registers collectors to collect data from GitHub to be used by composite metric providers:

- `scorecard-backend-module-dora`:

  - `github:deployments`
  - `github:deploymentWorkflowRuns`
  - `github:deploymentPullRequests`

### Collector contracts

Collectors in Scorecard are schema-validated at runtime. Any custom collector replacing a GitHub collector must return data that conforms to the same contract expected by consumers.

Required entity annotations for GitHub collectors:

```yaml
metadata:
  annotations:
    github.com/project-slug: myorg/my-service
```

`github:deployments`

- **Input schema**
  - `from: string` (ISO datetime)
  - `to: string` (ISO datetime)
- **Output schema**
  - `deployments: Array<{ id: string; commitSha: string; environment?: string; createdAt: string; result: 'success' | 'failure' | '' }>`
- **Annotation requirements**
  - Requires `github.com/project-slug` on the entity
- **Behavior**
  - Records are returned in ascending `createdAt` order (oldest to newest)
  - Client-side fetch cap: at most **1000** deployments are collected per request. Pagination stops once the cap is reached, the cap keeps the most recent in-window runs

`github:deploymentWorkflowRuns`

- **Input schema**
  - `workflowName: string` (non-empty)
  - `from: string` (ISO datetime)
  - `to: string` (ISO datetime)
- **Output schema**
  - `deployments: Array<{ id: string; commitSha: string; environment?: string; createdAt: string; result: 'success' | 'failure' | '' }>`
- **Annotation requirements**
  - Requires `github.com/project-slug` on the entity
- **Behavior**
  - Records are returned in ascending `createdAt` order (oldest to newest)
  - `workflowName` can match the workflow display name, the full workflow path (for example `.github/workflows/deploy.yml`), or a filename suffix (for example `deploy.yml`)
  - Client-side fetch cap: at most **1000** workflow runs are collected per request. Pagination stops once the cap is reached, the cap keeps the most recent in-window runs

`github:deploymentPullRequests`

- **Input schema**
  - `baseCommitSha: string` (non-empty)
  - `headCommitSha: string` (non-empty)
- **Output schema**
  - `pullRequests: Array<{ id: string; firstCommitAt: string }>`
- **Annotation requirements**
  - Requires `github.com/project-slug` on the entity
- **Behavior**
  - The collector resolves commits between `baseCommitSha` and `headCommitSha`, collects associated pull requests for those commits, and de-duplicates pull requests by PR number.
  - `firstCommitAt` is the timestamp of the first commit returned for that pull request (Pull requests with missing `firstCommitAt` are skipped)
  - Client-side fetch cap: at most **1000** commits are fetched for the `baseCommitSha...headCommitSha` compare range. Pagination stops once the cap is reached

For a complete collector implementation guide, see [collectors.md](../scorecard-backend/docs/collectors.md).

## Default thresholds

Default thresholds for `github.openPRs`:

```yaml
# app-config.yaml
scorecard:
  metricProviders:
    github:
      openPRs:
        thresholds:
          rules:
            - key: success
              expression: '<10'
            - key: warning
              expression: '10-50'
            - key: error
              expression: '>50'
```

See [threshold configuration](../scorecard-backend/docs/thresholds.md) for custom thresholds configuration.

## Configuration

### Schedule Configuration

The Scorecard plugin uses Backstage's built-in scheduler service to automatically collect metrics from all registered providers every hour by default. However, this configuration can be changed in the `app-config.yaml` file. Here is an example of how to do that:

```yaml
scorecard:
  metricProviders:
    github:
      openPRs:
        schedule:
          frequency:
            cron: '0 6 * * *'
          timeout:
            minutes: 5
          initialDelay:
            seconds: 5
```

The schedule configuration follows Backstage's `SchedulerServiceTaskScheduleDefinitionConfig` [schema](https://github.com/backstage/backstage/blob/master/packages/backend-plugin-api/src/services/definitions/SchedulerService.ts#L157). See [Metric Collection Scheduling](../scorecard-backend/docs/providers.md#metric-collection-scheduling) for custom schedule configuration.
