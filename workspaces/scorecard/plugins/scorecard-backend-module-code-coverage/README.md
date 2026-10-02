# scorecard-backend-module-code-coverage

The code-coverage backend module for the scorecard plugin.

This module integrates with the [Backstage Community code-coverage plugin](https://github.com/backstage/community-plugins/tree/main/workspaces/code-coverage) to provide code coverage metrics in the scorecard.

## Metrics

This module provides the following metrics:

| Metric ID                       | Title                                 | Source                        |
| ------------------------------- | ------------------------------------- | ----------------------------- |
| `codeCoverage.linePercentage`   | Code coverage (Lines)                 | `aggregate.line.percentage`   |
| `codeCoverage.lineAvailable`    | Code coverage - Tracked lines of code | `aggregate.line.available`    |
| `codeCoverage.lineCovered`      | Code coverage - Covered lines of code | `aggregate.line.covered`      |
| `codeCoverage.lineMissed`       | Code coverage - Missed lines of code  | `aggregate.line.missed`       |
| `codeCoverage.branchPercentage` | Code coverage (Branches)              | `aggregate.branch.percentage` |
| `codeCoverage.branchAvailable`  | Code coverage - Tracked branches      | `aggregate.branch.available`  |
| `codeCoverage.branchCovered`    | Code coverage - Covered branches      | `aggregate.branch.covered`    |
| `codeCoverage.branchMissed`     | Code coverage - Missed branches       | `aggregate.branch.missed`     |

## Prerequisites

This module requires the [code-coverage-backend](https://github.com/backstage/community-plugins/tree/main/workspaces/code-coverage/plugins/code-coverage-backend) plugin to be installed and configured in your Backstage instance.

## Entity annotation

Entities must have the `backstage.io/code-coverage` annotation to be tracked by this module:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  annotations:
    backstage.io/code-coverage: enabled
spec:
  type: service
  owner: my-team
  lifecycle: production
```

## Importing data

This module reads coverage reports from the
[code-coverage-backend](https://github.com/backstage/community-plugins/tree/main/workspaces/code-coverage/plugins/code-coverage-backend)
plugin. You must first import coverage data into that plugin before the
scorecard can display metrics.

### Cobertura XML

```bash
curl -X POST \
  'http://localhost:7007/api/code-coverage/report?entity=component:default/my-service&coverageType=cobertura' \
  -H 'Content-Type: text/xml' \
  -H "Authorization: Bearer $SERVICE_TOKEN" \
  --data-binary @coverage/cobertura-coverage.xml
```

### LCOV

```bash
curl -X POST \
  'http://localhost:7007/api/code-coverage/report?entity=component:default/my-service&coverageType=lcov' \
  -H 'Content-Type: text/plain' \
  -H "Authorization: Bearer $SERVICE_TOKEN" \
  --data-binary @coverage/lcov.info
```

### Query parameters

| Parameter      | Description                                          |
| -------------- | ---------------------------------------------------- |
| `entity`       | Full entity ref, e.g. `component:default/my-service` |
| `coverageType` | Format of the coverage file: `cobertura` or `lcov`   |

### Demo data

The `examples/code-coverage/` directory in this workspace contains a
ready-to-use Cobertura XML report and an import script:

```bash
cd workspaces/scorecard
./examples/code-coverage/import.sh
```

The script imports the demo report for the `code-coverage-scorecard-only`
entity. See the script source for details and customization.

## Installation

Add the module to your backend:

```ts
backend.add(
  import(
    '@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-code-coverage'
  ),
);
```
