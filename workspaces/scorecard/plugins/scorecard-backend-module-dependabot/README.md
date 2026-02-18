# Scorecard Backend Module for Dependabot

Extension module for `backstage-plugin-scorecard-backend` that exposes **Dependabot Alerts** as a scorecard metric for catalog entities.

## Installation

```bash
yarn workspace backend add @red-hat-developer-hub/backstage-plugin-scorecard-backend-module-dependabot
```

```ts
// packages/backend/src/index.ts
backend.add(
  import('@red-hat-developer-hub/backstage-plugin-scorecard-backend'),
);
backend.add(
  import(
    '@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-dependabot'
  ),
);
```

## Entity annotation

Entities must have the GitHub repo annotation; you can optionally set a display title:

```yaml
metadata:
  annotations:
    github.com/project-slug: owner/repo # required, e.g. backstage/backstage
```

## Metric

| Metric ID           | Description                                                                    |
| ------------------- | ------------------------------------------------------------------------------ |
| `dependabot.alerts` | Score (0–9) derived from Dependabot alert severity (critical/high/medium/low). |

Thresholds are fixed in the module (low &lt;1, medium 1–4, high 4–7, critical &gt;7).
