# Scorecard Backend Module: Dependabot

Adds Dependabot alerts as a scorecard metric (`dependabot.alerts`, 0–9 from severity).

**Install:** `yarn workspace backend add @red-hat-developer-hub/backstage-plugin-scorecard-backend-module-dependabot` then `backend.add(import('@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-dependabot'))`.

**Setup:** Entities need `github.com/project-slug: owner/repo` and `github.com/dependabot: 'true'` (exact string) to opt in. GitHub token must have `security_events` (or Dependabot read) so the backend can call the Dependabot API.

**How it works:** **DependabotClient** fetches open alerts from the GitHub API (by severity, with pagination). **DependabotMetricProvider** (one per severity) uses the client to score entities. The **factory** (`createDependabotMetricProvider` / `createDependabotMetricProviders`) builds single or all-four providers; the module registers the four (critical, high, medium, low) with the scorecard backend.

## Default thresholds

All four severity metrics share the same default thresholds. Default thresholds for `dependabot.alerts_critical`:

```yaml
# app-config.yaml
scorecard:
  plugins:
    dependabot:
      alerts_critical:
        thresholds:
          rules:
            - key: success
              expression: '<1'
            - key: warning
              expression: '1-7'
            - key: error
              expression: '>7'
```

Replace `alerts_critical` with `alerts_high`, `alerts_medium`, or `alerts_low` for the other severity metrics. See [threshold configuration](../scorecard-backend/docs/thresholds.md) for custom configuration.
