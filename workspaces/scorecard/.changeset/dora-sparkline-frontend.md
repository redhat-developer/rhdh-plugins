---
'@red-hat-developer-hub/backstage-plugin-scorecard': minor
---

Add sparkline chart support for entity-page metrics whose `defaultVisualization` is `sparkline`. Renders a 30-day time-series area chart via `GET /metrics/catalog/:kind/:namespace/:name/time-series` and a "View data sources" dialog backed by `GET /metrics/:metricId/collectors`. Includes shared `SparklineChart` component, threshold legend, chart view-model utilities, and i18n for collector labels.
