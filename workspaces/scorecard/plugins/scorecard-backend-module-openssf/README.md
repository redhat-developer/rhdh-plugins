# Scorecard Backend Module for OpenSSF

Adds [OpenSSF Security Scorecard](https://securityscorecards.dev/) metrics to the Scorecard backend. Fetches scorecard data from the URL configured per component (`openssf/baseUrl`), so it can use the public API, a self-hosted endpoint, or any other scorecard source. Exposes 18 checks as Backstage metrics (scores 0–10).

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

| Annotation        | Required | Description                                                                 |
| ----------------- | -------- | --------------------------------------------------------------------------- |
| `openssf/baseUrl` | Yes      | Full scorecard API URL for this component (e.g. public API or self-hosted). |

Example:

```yaml
metadata:
  annotations:
    openssf/baseUrl: https://api.securityscorecards.dev/projects/github.com/owner/repo
```

### Thresholds

All OpenSSF metrics use fixed thresholds: **Error** &lt;2, **Warning** 2–7, **Success** &gt;7. Not configurable. See [threshold docs](../scorecard-backend/docs/thresholds.md).

## Metrics

18 metrics from [OpenSSF checks](https://github.com/ossf/scorecard/blob/main/docs/checks.md): `openssf.binary_artifacts`, `openssf.branch_protection`, `openssf.cii_best_practices`, `openssf.ci_tests`, `openssf.code_review`, `openssf.contributors`, `openssf.dangerous_workflow`, `openssf.dependency_update_tool`, `openssf.fuzzing`, `openssf.license`, `openssf.maintained`, `openssf.packaging`, `openssf.pinned_dependencies`, `openssf.sast`, `openssf.security_policy`, `openssf.signed_releases`, `openssf.token_permissions`, `openssf.vulnerabilities`.

## Troubleshooting

- **Metric "not found"**: Scorecard URL unreachable, repo not yet analyzed, or score outside 0–10.
