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

### GitHub open PRs (`github.open_prs`)

This metric counts all pull requests that are currently in an "open" state for the repository specified in the entity's `github.com/project-slug` annotation.

- **Metric ID**: `github.open_prs`
- **Type**: Number
- **Datasource**: `github`
- **Default thresholds**:

  ```yaml
  # app-config.yaml
  scorecard:
    plugins:
      github:
        open_prs:
          thresholds:
            rules:
              - key: error
                expression: '>50'
              - key: warning
                expression: '10-50'
              - key: success
                expression: '<10'
  ```

## Configuration

### Threshold Configuration

Thresholds define conditions that determine which category a metric value belongs to ( `error`, `warning`, or `success`). You can configure custom thresholds for the GitHub metrics. Check out detailed explanation of [threshold configuration](../scorecard-backend/docs/thresholds.md).

## Schedule Configuration

The Scorecard plugin uses Backstage's built-in scheduler service to automatically collect metrics from all registered providers.

```yaml
scorecard:
  plugins:
    jira:
      open_prs:
        schedule:
          frequency:
            cron: '0 6 * * *'
          timeout:
            minutes: 5
          initialDelay:
            seconds: 5
```

The schedule configuration follows Backstage's `SchedulerServiceTaskScheduleDefinitionConfig` [schema](https://github.com/backstage/backstage/blob/master/packages/backend-plugin-api/src/services/definitions/SchedulerService.ts#L157).
