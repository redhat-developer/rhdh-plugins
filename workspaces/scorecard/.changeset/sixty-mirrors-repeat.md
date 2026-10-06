---
'@red-hat-developer-hub/backstage-plugin-scorecard': minor
---

**BREAKING** Remove the fixed NFS homepage scorecard widgets. Use `home-page-widget:scorecard/scorecard-aggregated-card` (`ScorecardAggregatedCard`, title Scorecard) and set `aggregationId` in the card settings.

Allow a custom aggregation id on an editable NFS Scorecard homepage card so it can target a KPI key or a metric id such as `github.openPRs`.
