---
'@red-hat-developer-hub/backstage-plugin-scorecard-backend': minor
'@red-hat-developer-hub/backstage-plugin-scorecard-common': minor
'@red-hat-developer-hub/backstage-plugin-scorecard': minor
---

Aggregated scorecards now use **aggregation IDs** and dedicated HTTP routes. The old catalog-aggregations URL still works but is **deprecated** (not removed).

**Backend (`@red-hat-developer-hub/backstage-plugin-scorecard-backend`)**

- **Deprecated:** `GET /metrics/:metricId/catalog/aggregations` — responses are unchanged, but the handler emits [RFC 8594](https://datatracker.ietf.org/doc/html/rfc8594) `Deprecation` and `Link` headers (alternate successor: `GET .../aggregations/:aggregationId`) and logs a warning. Prefer **`GET /aggregations/:aggregationId`** for new integrations.
- **Added:** `GET /aggregations/:aggregationId` for aggregated results using configured aggregation.
- **Added:** `GET /aggregations/:aggregationId/metadata` for KPI titles, descriptions, and aggregation metadata consumed by the UI.

**Common (`@red-hat-developer-hub/backstage-plugin-scorecard-common`)**

- Types and constants aligned with the aggregation config and new API shapes.

**Frontend (`@red-hat-developer-hub/backstage-plugin-scorecard`)**

- Homepage and aggregated flows resolve cards via **`aggregationId`**, fetch metadata from the new endpoint, and keep localized threshold and error strings where translation keys exist.

**Action for adopters:** Configure aggregated scorecards with `aggregationId` values that match backend aggregation config, replace direct calls to `GET /metrics/:metricId/catalog/aggregations` with `GET /aggregations/:aggregationId` (and metadata if you need the same labels as the plugin UI).
