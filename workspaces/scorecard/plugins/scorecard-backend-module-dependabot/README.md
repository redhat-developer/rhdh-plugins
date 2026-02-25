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

## GitHub token permission

The GitHub integration token must have the **`security_events`** scope (classic personal access token; in the GitHub UI this may appear as **Security events** or **repo.security_events**) or **Dependabot alerts** read permission (GitHub App) so the backend can fetch data from the Dependabot API. Without it, the API returns no alerts.

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

Thresholds are fixed in the module (success &lt;1, warning 1–7, error &gt;7), using the standard status keys required by the scorecard backend.
