# Scorecard Backend Module: Codecov

Adds [Codecov](https://about.codecov.io/) code coverage metrics to the scorecard plugin. Registers one metric provider per metric, each backed by a single Codecov API call per entity.

## Metrics

| Metric ID               | Type   | Description                             |
| ----------------------- | ------ | --------------------------------------- |
| `codecov.coverage`      | number | Current code coverage percentage        |
| `codecov.coverageTrend` | number | Code coverage trend for the last 7 days |
| `codecov.trackedFiles`  | number | Number of files tracked by Codecov      |
| `codecov.trackedLines`  | number | Total lines of code tracked by Codecov  |
| `codecov.coveredLines`  | number | Number of lines covered by tests        |
| `codecov.partialLines`  | number | Number of partially covered lines       |
| `codecov.missedLines`   | number | Number of lines not covered by tests    |

## Installation

```bash
yarn workspace backend add @red-hat-developer-hub/backstage-plugin-scorecard-backend-module-codecov
```

Then register the module in your backend:

```ts
// packages/backend/src/index.ts
backend.add(
  import(
    '@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-codecov'
  ),
);
```

## Entity annotation

Entities need the `codecov.io/repo` annotation to opt in:

```yaml
metadata:
  annotations:
    codecov.io/repo: owner/repo
```

The module resolves the Codecov service from the entity's annotations. If the entity also has a `github.com/project-slug` annotation, the service defaults to `github`. Otherwise, set the service explicitly:

```yaml
metadata:
  annotations:
    codecov.io/repo: owner/repo
    codecov.io/service: github
```

### Optional annotations

| Annotation           | Description                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------------- |
| `codecov.io/repo`    | **Required.** The Codecov repository in `owner/repo` or `repo` format.                                     |
| `codecov.io/service` | Git hosting service (`github`, `gitlab`, `bitbucket`). Inferred from `github.com/project-slug` if present. |
| `codecov.io/owner`   | Override the repository owner (if not using `owner/repo` format).                                          |
| `codecov.io/account` | Codecov account name for multi-account setups (maps to config accounts).                                   |

## Configuration

Configuration is optional for public repositories. For private repositories, configure an auth token:

```yaml
# app-config.yaml
codecov:
  accounts:
    - name: default
      authToken: ${CODECOV_API_TOKEN}
```

### Multiple accounts

```yaml
# app-config.yaml
codecov:
  defaultAccount: primary
  accounts:
    - name: primary
      authToken: ${CODECOV_PRIMARY_TOKEN}
    - name: oss
      # authToken optional for public repos
```

Then set the `codecov.io/account` annotation on entities to route them to the correct account:

```yaml
metadata:
  annotations:
    codecov.io/repo: owner/repo
    codecov.io/account: oss
```
