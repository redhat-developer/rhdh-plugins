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

Define which files to check under `scorecard.plugins.filecheck.files` in your `app-config.yaml`. Each entry is a single key–value pair where the key becomes the metric identifier suffix and the value is the relative file path inside the repository:

```yaml
# app-config.yaml
scorecard:
  plugins:
    filecheck:
      files:
        - readme: README.md
        - license: LICENSE
        - codeowners: CODEOWNERS
        - contributing: CONTRIBUTING.md
```

This produces the following metrics:

| Metric ID                | Checked file path |
| ------------------------ | ----------------- |
| `filecheck.readme`       | `README.md`       |
| `filecheck.license`      | `LICENSE`         |
| `filecheck.codeowners`   | `CODEOWNERS`      |
| `filecheck.contributing` | `CONTRIBUTING.md` |

If no files are configured, no metrics are registered and the module has no effect.

**File path rules:**

- Paths must be relative (no leading `/` or `./`).
- Paths must not contain newlines, quotes (`"`), or backslashes.

### Entity Requirements

Entities must have the `backstage.io/source-location` annotation set (typically added automatically by the catalog ingestion process):

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
- **Type**: Boolean
- **Datasource**: `filecheck`
- **Default thresholds**:

  | Threshold key | Expression | Description            |
  | ------------- | ---------- | ---------------------- |
  | `exist`       | `==true`   | File exists (success)  |
  | `missing`     | `==false`  | File is absent (error) |

### Threshold Configuration

You can override the default thresholds via `app-config.yaml`. Check out the detailed explanation of [threshold configuration](../scorecard-backend/docs/thresholds.md).

## Schedule Configuration

The Scorecard plugin uses Backstage's built-in scheduler service to automatically collect metrics from all registered providers every hour by default. You can change this schedule in the `app-config.yaml` file:

```yaml
scorecard:
  plugins:
    filecheck:
      schedule:
        frequency:
          cron: '0 6 * * *'
        timeout:
          minutes: 5
        initialDelay:
          seconds: 5
```

The schedule configuration follows Backstage's `SchedulerServiceTaskScheduleDefinitionConfig` [schema](https://github.com/backstage/backstage/blob/master/packages/backend-plugin-api/src/services/definitions/SchedulerService.ts#L157).

Note: all configured file checks share a single schedule — the module fetches each entity's repository tree once per run and checks all configured paths in that single request.
