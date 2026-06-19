# scorecard-backend-module-code-coverage

The code-coverage backend module for the scorecard plugin.

This module integrates with the [Backstage Community code-coverage plugin](https://github.com/backstage/community-plugins/tree/main/workspaces/code-coverage) to provide code coverage metrics in the scorecard.

## Metrics

This module provides the following metrics:

| Metric ID                         | Title                                 | Source                        |
| --------------------------------- | ------------------------------------- | ----------------------------- |
| `code-coverage.line_percentage`   | Code coverage (Lines)                 | `aggregate.line.percentage`   |
| `code-coverage.line_available`    | Code coverage - Tracked lines of code | `aggregate.line.available`    |
| `code-coverage.line_covered`      | Code coverage - Covered lines of code | `aggregate.line.covered`      |
| `code-coverage.line_missed`       | Code coverage - Missed lines of code  | `aggregate.line.missed`       |
| `code-coverage.branch_percentage` | Code coverage (Branches)              | `aggregate.branch.percentage` |
| `code-coverage.branch_available`  | Code coverage - Tracked branches      | `aggregate.branch.available`  |
| `code-coverage.branch_covered`    | Code coverage - Covered branches      | `aggregate.branch.covered`    |
| `code-coverage.branch_missed`     | Code coverage - Missed branches       | `aggregate.branch.missed`     |

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

## Installation

Add the module to your backend:

```ts
backend.add(
  import(
    '@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-code-coverage'
  ),
);
```
