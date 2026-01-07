# Scorecard Backend Module for OpenSSF

This is an extension module to the `backstage-plugin-scorecard-backend` plugin. It provides [OpenSSF Security Scorecard](https://securityscorecards.dev/) metrics for software components registered in the Backstage catalog.

## Overview

The OpenSSF Security Scorecards project provides automated security assessments for open source projects hosted on GitHub. This module fetches scorecard data from the public OpenSSF API and exposes individual security check scores as metrics in Backstage.

## Prerequisites

Before installing this module, ensure that the Scorecard backend plugin is integrated into your Backstage instance. Follow the [Scorecard backend plugin README](../scorecard-backend/README.md) for setup instructions.

## Installation

To install this backend module:

```bash
# From your root directory
yarn workspace backend add @red-hat-developer-hub/backstage-plugin-scorecard-backend-module-openssf
```

```ts
// packages/backend/src/index.ts
import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

// Scorecard backend plugin
backend.add(
  import('@red-hat-developer-hub/backstage-plugin-scorecard-backend'),
);

// Install the OpenSSF module
/* highlight-add-next-line */
backend.add(
  import(
    '@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-openssf'
  ),
);

backend.start();
```

## Entity Annotations

For the OpenSSF metrics to work, your catalog entities must have the required annotation:

```yaml
# catalog-info.yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  annotations:
    # Required: GitHub repository in owner/repo format
    openssf/project: owner/repo
spec:
  type: service
  lifecycle: production
  owner: my-team
```

The `openssf/project` annotation should contain the GitHub repository path in `owner/repo` format (e.g., `kubernetes/kubernetes`).

## Configuration

This module uses the public OpenSSF Security Scorecards API (`api.securityscorecards.dev`) and does not require any additional configuration in `app-config.yaml`.

### Thresholds

Thresholds define conditions that determine which category a metric value belongs to (`error`, `warning`, or `success`). Check out detailed explanation of [threshold configuration](../scorecard-backend/docs/thresholds.md).

All OpenSSF metrics use the following **fixed** thresholds:

| Category | Expression | Description                       |
| -------- | ---------- | --------------------------------- |
| Error    | `<2`       | Score less than 2                 |
| Warning  | `2-7`      | Score between 2 and 7 (inclusive) |
| Success  | `>7`       | Score greater than 7              |

> **Note:** These thresholds are not configurable via `app-config.yaml`. They are defined in the module source code.

## Available Metrics

This module provides 18 metrics corresponding to the [OpenSSF Security Scorecard checks](https://github.com/ossf/scorecard/blob/main/docs/checks.md). Each metric returns a score from 0 to 10.

| Metric ID                        | Risk     | Description                                                                                                                |
| -------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `openssf.binary_artifacts`       | High     | Determines if the project has generated executable (binary) artifacts in the source repository.                            |
| `openssf.branch_protection`      | High     | Determines if the default and release branches are protected with GitHub's branch protection or repository rules settings. |
| `openssf.cii_best_practices`     | Low      | Determines if the project has an OpenSSF (formerly CII) Best Practices Badge.                                              |
| `openssf.ci_tests`               | Low      | Determines if the project runs tests before pull requests are merged.                                                      |
| `openssf.code_review`            | High     | Determines if the project requires human code review before pull requests are merged.                                      |
| `openssf.contributors`           | Low      | Determines if the project has contributors from multiple organizations.                                                    |
| `openssf.dangerous_workflow`     | Critical | Determines if the project's GitHub Action workflows avoid dangerous patterns.                                              |
| `openssf.dependency_update_tool` | High     | Determines if the project uses a dependency update tool.                                                                   |
| `openssf.fuzzing`                | Medium   | Determines if the project uses fuzzing.                                                                                    |
| `openssf.license`                | Low      | Determines if the project has defined a license.                                                                           |
| `openssf.maintained`             | High     | Determines if the project is "actively maintained".                                                                        |
| `openssf.packaging`              | Medium   | Determines if the project is published as a package that others can easily download, install, update, and uninstall.       |
| `openssf.pinned_dependencies`    | Medium   | Determines if the project has declared and pinned the dependencies of its build process.                                   |
| `openssf.sast`                   | Medium   | Determines if the project uses static code analysis.                                                                       |
| `openssf.security_policy`        | Medium   | Determines if the project has published a security policy.                                                                 |
| `openssf.signed_releases`        | High     | Determines if the project cryptographically signs release artifacts.                                                       |
| `openssf.token_permissions`      | High     | Determines if the project's automated workflow tokens follow the principle of least privilege.                             |
| `openssf.vulnerabilities`        | High     | Determines if the project has open, unfixed vulnerabilities in its codebase or dependencies using OSV.                     |

## Troubleshooting

### Metric shows "not found"

This can occur if:

- The repository has not been analyzed by OpenSSF Scorecards yet
- The repository is private (OpenSSF only analyzes public repositories)
- The repository path in the annotation is incorrect
- The metric score is lower than -1 or higher than 10.

### No data for my repository

OpenSSF Security Scorecards only analyzes **public GitHub repositories**. Private repositories and repositories on other Git hosting services are not supported.

To verify your repository has scorecard data, visit:

```
https://api.securityscorecards.dev/projects/github.com/{owner}/{repo}
```
