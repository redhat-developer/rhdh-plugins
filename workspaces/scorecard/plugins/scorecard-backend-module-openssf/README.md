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

## Metrics

18 metrics from [OpenSSF checks](https://github.com/ossf/scorecard/blob/main/docs/checks.md):

| Metric ID                      | Provider ID                    | Description                                                                                 |
| ------------------------------ | ------------------------------ | ------------------------------------------------------------------------------------------- |
| `openssf.binaryArtifacts`      | `openssf.binaryArtifacts`      | No executable (binary) artifacts in the source repository.                                  |
| `openssf.branchProtection`     | `openssf.branchProtection`     | Default and release branches protected (e.g. require review, status checks, no force push). |
| `openssf.ciiBestPractices`     | `openssf.ciiBestPractices`     | Project has an OpenSSF Best Practices badge (passing, silver, or gold).                     |
| `openssf.ciTests`              | `openssf.ciTests`              | Tests run before pull requests are merged.                                                  |
| `openssf.codeReview`           | `openssf.codeReview`           | Human code review required before PRs are merged.                                           |
| `openssf.contributors`         | `openssf.contributors`         | Recent contributors from multiple organizations.                                            |
| `openssf.dangerousWorkflow`    | `openssf.dangerousWorkflow`    | GitHub Actions workflows avoid dangerous patterns (untrusted checkout, script injection).   |
| `openssf.dependencyUpdateTool` | `openssf.dependencyUpdateTool` | Dependency update tool in use (e.g. Dependabot, Renovate).                                  |
| `openssf.fuzzing`              | `openssf.fuzzing`              | Fuzzing in use (e.g. OSS-Fuzz, ClusterFuzzLite, or language fuzz tests).                    |
| `openssf.license`              | `openssf.license`              | Project has a published license.                                                            |
| `openssf.maintained`           | `openssf.maintained`           | Project is actively maintained (not archived, recent activity).                             |
| `openssf.packaging`            | `openssf.packaging`            | Project is published as a package.                                                          |
| `openssf.pinnedDependencies`   | `openssf.pinnedDependencies`   | Dependencies pinned (hash or fixed version) in build/release.                               |
| `openssf.sast`                 | `openssf.sast`                 | Static application security testing (SAST) in use.                                          |
| `openssf.securityPolicy`       | `openssf.securityPolicy`       | Security policy present (e.g. SECURITY.md).                                                 |
| `openssf.signedReleases`       | `openssf.signedReleases`       | Releases are cryptographically signed.                                                      |
| `openssf.tokenPermissions`     | `openssf.tokenPermissions`     | GitHub Actions use minimal token permissions.                                               |
| `openssf.vulnerabilities`      | `openssf.vulnerabilities`      | Known vulnerabilities in dependencies (lower score = more issues).                          |

## Default thresholds

All OpenSSF metrics share the same default thresholds. Default thresholds for `openssf.maintained`:

```yaml
# app-config.yaml
scorecard:
  metricProviders:
    openssf:
      maintained:
        thresholds:
          rules:
            - key: success
              expression: '>7'
            - key: warning
              expression: '2-7'
            - key: error
              expression: '<2'
```

Higher scores are better (OpenSSF check scores are 0–10). Replace `maintained` with any OpenSSF metric provider name (e.g. `branchProtection`, `license`). See [threshold configuration](../scorecard-backend/docs/thresholds.md) for custom configuration.

## Troubleshooting

- **Metric "not found"**: Scorecard URL unreachable, repo not yet analyzed, or score outside 0–10.
