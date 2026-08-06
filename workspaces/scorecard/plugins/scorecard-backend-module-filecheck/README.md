# Scorecard Backend Module for File Checks

This is an extension module to the `backstage-plugin-scorecard-backend` plugin. It provides configurable file-existence metrics for software components registered in the Backstage catalog, checking whether specific files (e.g., `README.md`, `LICENSE`, `CODEOWNERS`) are present in a component's source repository.

## Prerequisites

Before installing this module, ensure that the Scorecard backend plugin is integrated into your Backstage instance. Follow the [Scorecard backend plugin README](../scorecard-backend/README.md) for setup instructions.

Entities must have a `backstage.io/source-location` annotation so the module can resolve the source repository and read its file tree.

## Installation

To install this backend module:

```bash
# From your root directory
yarn workspace backend add @red-hat-developer-hub/backstage-plugin-scorecard-backend-module-filecheck
```

```ts
// packages/backend/src/index.ts
import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

// Scorecard backend plugin
backend.add(
  import('@red-hat-developer-hub/backstage-plugin-scorecard-backend'),
);

// Install the File Check module
/* highlight-add-next-line */
backend.add(
  import(
    '@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-filecheck'
  ),
);

backend.start();
```

## Configuration

### Files Configuration

Define which files to check under `scorecard.metricProviders.filecheck.fileExistence.options.files` in your `app-config.yaml`. Keys become the metric identifier suffix and values are relative file paths inside the repository:

```yaml
# app-config.yaml
scorecard:
  metricProviders:
    filecheck:
      fileExistence:
        options:
          files:
            readme: README.md
            license: LICENSE
            codeowners: CODEOWNERS
            contributing: CONTRIBUTING.md
```

This produces the following metrics:

| Metric ID                | Provider ID               | Checked file path |
| ------------------------ | ------------------------- | ----------------- |
| `filecheck.readme`       | `filecheck.fileExistence` | `README.md`       |
| `filecheck.license`      | `filecheck.fileExistence` | `LICENSE`         |
| `filecheck.codeowners`   | `filecheck.fileExistence` | `CODEOWNERS`      |
| `filecheck.contributing` | `filecheck.fileExistence` | `CONTRIBUTING.md` |

If no files are configured, no metrics are registered and the module has no effect.

**File path rules:**

- Paths must be relative (no leading `/`, `./` or `../`).
- Paths must not contain newlines, quotes (`"`), or backslashes.

### Entity Requirements

Only **Component** entities are checked. They must have the `backstage.io/source-location` annotation set (typically added automatically by the catalog ingestion process):

```yaml
# catalog-info.yaml
metadata:
  annotations:
    backstage.io/source-location: url:https://github.com/myorg/my-service
```

## Available Metrics

### File existence check (`filecheck.<id>`)

Each configured file produces one boolean metric.

- **Metric ID**: `filecheck.<id>` (where `<id>` is the key from the `files` config)
- **Provider ID**: `filecheck.fileExistence`
- **Type**: Boolean
- **Datasource**: `filecheck`

## Default thresholds

All configured file checks share the same default thresholds. Provider-level thresholds for `filecheck.fileExistence` (applies to every `filecheck.<id>` metric):

```yaml
# app-config.yaml
scorecard:
  metricProviders:
    filecheck:
      fileExistence:
        thresholds:
          rules:
            - key: exist
              expression: '==true'
              icon: scorecardSuccessStatusIcon
              color: 'success.main'
            - key: missing
              expression: '==false'
              icon: scorecardErrorStatusIcon
              color: 'error.main'
```

Custom threshold keys other than `success`, `warning`, or `error` must include `color` and `icon` in app-config.

See [threshold configuration](../scorecard-backend/docs/thresholds.md) for custom configuration.

## Schedule Configuration

The Scorecard plugin uses Backstage's built-in scheduler service to automatically collect metrics from all registered providers every hour by default. You can change this schedule in the `app-config.yaml` file:

```yaml
scorecard:
  metricProviders:
    filecheck:
      fileExistence:
        schedule:
          frequency:
            cron: '0 6 * * *'
          timeout:
            minutes: 5
          initialDelay:
            seconds: 5
```

The schedule configuration follows Backstage's `SchedulerServiceTaskScheduleDefinitionConfig` [schema](https://github.com/backstage/backstage/blob/master/packages/backend-plugin-api/src/services/definitions/SchedulerService.ts#L157). For more details on how to configure schedule, see [Metric Collection Scheduling](../scorecard-backend/docs/providers.md#metric-collection-scheduling).

Note: all configured file checks share a single schedule — the module fetches each entity's repository tree once per run and checks all configured paths in that single request.
