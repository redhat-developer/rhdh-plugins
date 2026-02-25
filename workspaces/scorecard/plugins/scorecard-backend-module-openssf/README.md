# Scorecard Backend Module for OpenSSF

Adds [OpenSSF Security Scorecard](https://securityscorecards.dev/) metrics to the Scorecard backend. Fetches scorecard data from the URL configured per component (`openssf/scorecard-location`), so it can use the public API, a self-hosted endpoint, or any other scorecard source. Exposes 18 checks as Backstage metrics (scores 0–10).

Requires the [Scorecard backend plugin](../scorecard-backend/README.md) to be installed.

## Installation

```bash
yarn workspace backend add @red-hat-developer-hub/backstage-plugin-scorecard-backend-module-openssf
```

```ts
// packages/backend/src/index.ts
import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();
backend.add(
  import('@red-hat-developer-hub/backstage-plugin-scorecard-backend'),
);
backend.add(
  import(
    '@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-openssf'
  ),
);
backend.start();
```

## Configuration

### Catalog (catalog-info.yaml)

| Annotation                   | Required | Description                                                                 |
| ---------------------------- | -------- | --------------------------------------------------------------------------- |
| `openssf/scorecard-location` | Yes      | Full scorecard API URL for this component (e.g. public API or self-hosted). |

Example:

```yaml
metadata:
  annotations:
    openssf/scorecard-location: https://api.securityscorecards.dev/projects/github.com/owner/repo
```

### Thresholds

All OpenSSF metrics use fixed thresholds: **Error** &lt;2, **Warning** 2–7, **Success** &gt;7. Not configurable. See [threshold docs](../scorecard-backend/docs/thresholds.md).

## Metrics

18 metrics from [OpenSSF checks](https://github.com/ossf/scorecard/blob/main/docs/checks.md):

| Metric                           | Description                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| `openssf.binary_artifacts`       | No executable (binary) artifacts in the source repository.                                  |
| `openssf.branch_protection`      | Default and release branches protected (e.g. require review, status checks, no force push). |
| `openssf.cii_best_practices`     | Project has an OpenSSF Best Practices badge (passing, silver, or gold).                     |
| `openssf.ci_tests`               | Tests run before pull requests are merged.                                                  |
| `openssf.code_review`            | Human code review required before PRs are merged.                                           |
| `openssf.contributors`           | Recent contributors from multiple organizations.                                            |
| `openssf.dangerous_workflow`     | GitHub Actions workflows avoid dangerous patterns (untrusted checkout, script injection).   |
| `openssf.dependency_update_tool` | Dependency update tool in use (e.g. Dependabot, Renovate).                                  |
| `openssf.fuzzing`                | Fuzzing in use (e.g. OSS-Fuzz, ClusterFuzzLite, or language fuzz tests).                    |
| `openssf.license`                | Project has a published license.                                                            |
| `openssf.maintained`             | Project is actively maintained (not archived, recent activity).                             |
| `openssf.packaging`              | Project is published as a package.                                                          |
| `openssf.pinned_dependencies`    | Dependencies pinned (hash or fixed version) in build/release.                               |
| `openssf.sast`                   | Static application security testing (SAST) in use.                                          |
| `openssf.security_policy`        | Security policy present (e.g. SECURITY.md).                                                 |
| `openssf.signed_releases`        | Releases are cryptographically signed.                                                      |
| `openssf.token_permissions`      | GitHub Actions use minimal token permissions.                                               |
| `openssf.vulnerabilities`        | Known vulnerabilities in dependencies (lower score = more issues).                          |

## Troubleshooting

- **Metric "not found"**: Scorecard URL unreachable, repo not yet analyzed, or score outside 0–10.
