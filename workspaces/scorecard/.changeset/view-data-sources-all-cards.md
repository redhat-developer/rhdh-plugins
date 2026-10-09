---
'@red-hat-developer-hub/backstage-plugin-scorecard': patch
---

Show View data sources on all homepage and entity scorecard cards, not only sparklines. Non-composite metrics (including sparkline charts with no collectors) now list the metric check instead of an empty dialog. Aggregated cards show the check description; scalar/weighted/sparkline dialogs use the aggregated value and threshold status, while status-grouped cards show N/A for value and status. Translation keys `metricGroupCard.menuAriaLabel` and `metricGroupCard.viewDataSources` are now `card.menuAriaLabel` and `card.viewDataSources`.
