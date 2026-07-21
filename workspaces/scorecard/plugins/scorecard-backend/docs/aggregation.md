# Entity Aggregation

The Scorecard plugin provides an aggregation endpoint that returns metrics aggregated across all entities owned by the authenticated user. This feature allows users to get a consolidated view of metrics across their entire portfolio of owned entities.

## Overview

The aggregation endpoint (`/aggregations/:aggregationId`) aggregates metrics from multiple entities based on entity ownership. It collects metrics from:

- Entities **directly owned** by the user
- Entities owned by **groups the user is a direct member of**

### Important limitation: direct parent groups only

**Only direct parent groups are considered.** The aggregation does not traverse nested group hierarchies by default.

**Example:**

- User `alice` is a member of `group:default/developers`
- `group:default/developers` is a member of `group:default/engineering`

In this case:

- ✅ Entities owned by `alice` directly are included
- ✅ Entities owned by `group:default/developers` are included
- ❌ Entities owned by `group:default/engineering` are **NOT** included

**Enabling Transitive Ownership:**

To include entities from all parent groups in the aggregation (not just direct parent groups), you can enable transitive parent groups. If you're using Red Hat Developer Hub (RHDH), you can enable transitive parent groups by following the [transitive parent group enablement documentation](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.5/html-single/authorization_in_red_hat_developer_hub/index#enabling-transitive-parent-groups). This will allow the aggregation to traverse nested group hierarchies and include entities from all parent groups in the hierarchy.

## Aggregation types

KPIs under **`scorecard.aggregationKPIs`** declare a **`type`** that selects an aggregation strategy on the backend.

### Status Grouped type

The **`statusGrouped`** type loads each owned entity’s metric status, buckets entities by status key (success, warning, error, etc.), and returns **counts per status** summed across the portfolio. Use it when you want a breakdown of how many entities are in each state (for example a status pie chart).

#### Configuration example:

```yaml
scorecard:
  aggregationKPIs:
    openIssuesKpi:
      title: 'Jira open issues KPI'
      description: 'Open issues across entities you own, grouped by status.'
      type: statusGrouped
      metricId: jira.open_issues
```

### Weighted Status Score type

The **`weightedStatusScore`** type rolls up each owned entity’s metric into status keys, applies **`options.statusScores`** (weights per status key), and returns **one normalized score** as a **percentage** in \[0, 100\] (one decimal), scaled against the metric’s threshold rules. Use it when you want a single “portfolio health” number (for example a donut gauge on the homepage).

#### Configuration example:

```yaml
scorecard:
  aggregationKPIs:
    openPrsWeightedKpi:
      title: 'GitHub open PRs (weighted health)'
      description: 'Weighted health from status counts using configurable scores.'
      type: weightedStatusScore
      metricId: github.open_prs
      options:
        statusScores:
          success: 100
          warning: 50
          error: 0
        # Optional: colors for the weightedStatusScore donut (expressions apply to percentage 0–100)
        thresholds:
          rules:
            - key: success
              expression: '>=75'
              color: success.main
            - key: warning
              expression: '10-75'
              color: warning.main
            - key: error
              expression: '<10'
              color: error.main
```

1. The `options.statusScores` attribute is required for the `weightedStatusScore` aggregation type.
2. The `options.thresholds` attribute is optional; it configures the aggregation card.
3. Aggregates status counts for `metricId` across owned entities.
4. Score is `count × weight` per status; missing `statusScores` keys use weight `0`.
5. Result is a percentage in [0, 100] (one decimal). See [thresholds.md](./thresholds.md#4-aggregation-kpi-result-thresholds-weightedstatusscore-type) for defaults.

### Scalar types

**Scalar types** (`sum`, `average`, `max`, `min`, `count`) roll up each owned entity’s **latest numeric metric value** — the **numeric `value`** from the **latest** stored `metric_values` row for the configured **`metricId`** — into a single number (or entity count for `count`), instead of bucketing by threshold status. Use them for portfolio totals, averages, extremes, or entity counts without a per-status breakdown. Clients can detect scalar responses by checking **`metadata.aggregationType`** against the scalar type literals (or `scalarAggregationTypes` from scorecard-common).

Shared behavior for all scalar types:

1. **Latest row per entity:** Same scope as other aggregation KPIs — one row per owned catalog entity ref (the row with the highest `id` for that entity and metric).
2. **Calculation failures excluded:** Rows where `error_message` is set and `value` is null are excluded from the aggregate (same rule as status-grouped aggregation).
3. **SQL function:** `sum` → `SUM(value)`, `average` → `AVG(value)`, `max` → `MAX(value)`, `min` → `MIN(value)`, `count` → `COUNT(*)` over rows with a non-null value.
4. **Metric type rules:** All scalar types require a **number** metric. Startup validation rejects scalar KPIs that target a boolean metric.
5. **Optional result thresholds:** `options.thresholds` (number-style rules) can color or classify the aggregated **`value`**. When omitted, the API returns **`DEFAULT_NUMBER_THRESHOLDS`**. See [thresholds.md — Aggregation KPI result thresholds (scalar types)](./thresholds.md#5-aggregation-kpi-result-thresholds-scalar-types).

### Sum type

The **`sum`** type adds each owned entity’s latest numeric metric value and returns a **single portfolio total**. Use it when you want a headline total (for example total open bugs across entities you own).

#### Configuration example:

```yaml
scorecard:
  aggregationKPIs:
    totalOpenBugs:
      title: 'Total Open Bugs'
      description: 'Sum of open issues across owned entities.'
      type: sum
      metricId: jira.open_issues
      # Optional: colors for the aggregated total
      options:
        thresholds:
          rules:
            - key: success
              expression: '<=10'
              color: success.main
            - key: warning
              expression: '10-50'
              color: warning.main
            - key: error
              expression: '>50'
              color: error.main
```

### Average type

The **`average`** type computes the **mean** of each owned entity’s latest numeric metric value (entities without a non-null latest value are excluded). Use it when you want a typical per-entity figure (for example average open PRs per entity).

#### Configuration example:

```yaml
scorecard:
  aggregationKPIs:
    avgOpenPrs:
      title: 'Average Open PRs'
      description: 'Mean open PR count per entity.'
      type: average
      metricId: github.open_prs
```

### Max type

The **`max`** type returns the **highest** latest numeric metric value among owned entities. Use it when you want a worst-case or peak value in the portfolio (for example the entity with the most open PRs). This is the max of **latest** values per entity, not a historical extreme over time.

#### Configuration example:

```yaml
scorecard:
  aggregationKPIs:
    maxOpenPrs:
      title: 'Maximum Open PRs'
      description: 'Highest open PR count among owned entities.'
      type: max
      metricId: github.open_prs
```

### Min type

The **`min`** type returns the **lowest** latest numeric metric value among owned entities. Use it when you want a best-case or floor value in the portfolio (for example the entity with the fewest open PRs). This is the min of **latest** values per entity, not a historical extreme over time.

#### Configuration example:

```yaml
scorecard:
  aggregationKPIs:
    minOpenPrs:
      title: 'Minimum Open PRs'
      description: 'Lowest open PR count among owned entities.'
      type: min
      metricId: github.open_prs
```

### Count type

The **`count`** type returns the **number of owned entities** that have a non-null latest stored value for the configured **`metricId`**. Use it when you want coverage (“how many entities have data for this metric”) rather than a sum or mean of the values themselves. For **`count`**, **`result.value`** equals **`result.total`**.

#### Configuration example:

```yaml
scorecard:
  aggregationKPIs:
    entitiesWithOpenIssues:
      title: 'Entities with Open Issues'
      description: 'Count of entities with a stored open-issues value.'
      type: count
      metricId: jira.open_issues
```

### Type summary

| Type                      | Output                                                                                                     | Typical use                                     |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| **`statusGrouped`**       | Counts per status key across owned entities                                                                | “How many entities are green vs red” style pie. |
| **`weightedStatusScore`** | **`weightedStatusScore`** in \[0, 100\] (percent, one decimal) from weighted counts via **`statusScores`** | Portfolio health gauge from one headline score. |
| **`sum`**                 | Single numeric total of latest metric values across owned entities                                         | “Total open bugs across my portfolio.”          |
| **`average`**             | Mean of latest metric values across owned entities                                                         | “Average open PRs per entity.”                  |
| **`max`**                 | Maximum latest metric value across owned entities                                                          | “Worst-case / highest value in the portfolio.”  |
| **`min`**                 | Minimum latest metric value across owned entities                                                          | “Best-case / lowest value in the portfolio.”    |
| **`count`**               | Number of entities with a non-null latest stored value                                                     | “How many entities have data for this metric.”  |

## Configuration validation

- **`scorecard.aggregationKPIs`** is validated when the backend plugin starts. Invalid entries cause startup to fail with an error so misconfiguration is caught early. Fix app-config and redeploy.

- For aggregation types that support **`options.thresholds`**, threshold rules must satisfy the same **number interval / gap** rules as metric thresholds when multiple rules apply (union must cover the full real line with no gaps). Errors mention an approximate **first uncovered region**. See [Joint coverage (number metrics)](./thresholds.md#joint-coverage-number-metrics).

## API Endpoint

### `GET /aggregations/:aggregationId`

Use this endpoint for all new integrations.

- **`aggregationId`** may be a key under **`scorecard.aggregationKPIs`** in app-config (see the [backend README](../README.md#aggregation-kpis-homepage-and-get-aggregations)), which supplies **title**, **description**, **type**, **metricId**, and type-specific **`options`** (for example **`options.statusScores`** for **`weightedStatusScore`**, or optional **`options.thresholds`** for scalar types and **`weightedStatusScore`**).
- If there is **no** `scorecard.aggregationKPIs.<aggregationId>` block, the backend still responds successfully: it treats **`aggregationId` as the `metricId`** and uses the default **statusGrouped** strategy (same as calling **`/aggregations/<metricId>`** with a metric id). A **warning** is logged on the server so missing KPI config is visible in operator logs. To get a custom **title**, **`weightedStatusScore`** or **scalar** type, or other KPI options, you must add that block; a typo in the id falls through to this default and can look like “wrong” aggregation behavior in the UI, so check logs and app-config.

The response shape includes **`id`**, **`status`**, **`metadata`** (title, description, type, aggregation type), and **`result`**. The shape of **`result`** depends on the aggregation type:

- **`statusGrouped`**: counts per threshold rule, **`total`**, **`thresholds`**, **`entitiesConsidered`**, **`calculationErrorCount`**, **`timestamp`**.
- **`weightedStatusScore`**: same as status-grouped, plus **`weightedStatusScore`** (portfolio percentage in \[0, 100\], one decimal), **`weightedStatusSum`**, **`weightedStatusMaxPossible`**, and **`aggregationChartDisplayColor`** (see backend README). The homepage card shows a donut gauge for this type instead of a multi-slice status pie.
- **Scalar types** (`sum`, `average`, `max`, `min`, `count`): see [Scalar result fields](#scalar-result-fields) below.

### Scalar result fields

When **`metadata.aggregationType`** is one of **`sum`**, **`average`**, **`max`**, **`min`**, or **`count`**, **`result`** is a scalar aggregation payload:

| Field                       | Description                                                                                                                                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`value`**                 | Aggregated scalar from the configured SQL function (`sum`, `average`, `max`, `min`, or entity count for `count`) over latest non-null metric values. Evaluated by **`options.thresholds`** when present. |
| **`total`**                 | Number of latest rows that contributed to **`value`** (non-null values; calculation failures excluded). For **`count`**, equals **`value`**.                                                             |
| **`entitiesConsidered`**    | In-scope owned entities with **at least one** latest `metric_values` row for this metric (includes calculation-error rows).                                                                              |
| **`calculationErrorCount`** | Among **`entitiesConsidered`**, how many latest rows are metric calculation failures (`error_message` set and `value` null).                                                                             |
| **`timestamp`**             | ISO timestamp of the most recent among the latest rows in scope (same merge rule as other aggregation types).                                                                                            |
| **`thresholds`**            | Number-style threshold rules for classifying **`value`**; from **`options.thresholds`** or **`DEFAULT_NUMBER_THRESHOLDS`** when omitted. First matching rule can drive custom UI coloring.               |

Example (truncated):

```json
{
  "id": "totalOpenBugs",
  "status": "success",
  "metadata": {
    "title": "Total Open Bugs",
    "description": "Sum of open issues across owned entities",
    "type": "number",
    "aggregationType": "sum"
  },
  "result": {
    "value": 42,
    "total": 8,
    "entitiesConsidered": 10,
    "calculationErrorCount": 2,
    "timestamp": "2026-07-15T10:00:00.000Z",
    "thresholds": { "rules": [] }
  }
}
```

**`entitiesConsidered`** (all types): count of in-scope owned entities that have **at least one** latest `metric_values` row for this metric. **`calculationErrorCount`**: how many of those latest rows are metric calculation failures (`error_message` set and `value` null), so the homepage ratio matches the population behind the drill-down table rather than the raw number of owned catalog refs. For scalar types, **`total`** is the number of rows that contributed to **`value`** (non-null latest values, calculation failures excluded).

**“Without calculation errors” on the homepage:** `healthy = entitiesConsidered - calculationErrorCount` counts only among entities that already have a latest stored row for this metric. Owned entities with **no** row yet are omitted from **`entitiesConsidered`** (same as omitting them from the drill-down list until data exists).

**Partial totals:** The drill-down entities list can cap how many DB rows are considered and exposes **`entityHealth.countsArePartial`** when that cap applies. The aggregation path runs over the **full** list of owned catalog entity refs supplied to the query (there is no equivalent row cap), so **`entitiesConsidered`** / **`calculationErrorCount`** on **`GET /aggregations/:aggregationId`** are not marked partial in the same way.

### `GET /aggregations/:aggregationId/metadata`

Same resolution as above, but returns only metadata fields (no aggregate counts). Useful for UIs that list KPIs without loading full aggregation data.

#### Permissions and errors

- **`scorecard.metric.read`** on the underlying metric, and **`catalog.entity.read`** for each entity included in the aggregation.
- **Metric access denied**: `403 Forbidden` if the user cannot read the metric.
- **Missing user entity reference**: `401 Unauthorized` (`AuthenticationError`).
- **User not in catalog**: `404 Not Found` when applicable.
- **Per-entity denial**: `403 Forbidden` if the user cannot read a specific owned entity.

#### Empty results

When the user owns no relevant entities, the API returns an aggregation with **zero total** and zeroed bucket counts for distribution types, or **`value: 0`** with zeroed entity counts for scalar types (not an error).

### Drill-down vs aggregation id

The aggregation API uses **`aggregationId`** (KPI key or metric id). **Entity drill-down** remains **metric-scoped**: use **`GET /metrics/:metricId/catalog/aggregations/entities`** with the KPI’s **`metricId`**, not the KPI key. That applies to **`statusGrouped`**, **`weightedStatusScore`**, and **scalar** KPIs. See [drill-down.md](./drill-down.md).

### **Deprecated API:** `GET /metrics/:metricId/catalog/aggregations`

This route **remains callable** for existing clients. It returns the same aggregation as **`GET /aggregations/<metricId>`** when `<metricId>` is used as the path segment (default status-grouped aggregation for that metric).

**It is deprecated and will be removed in a future release.** Do not use it in new code - call **`GET /aggregations/:aggregationId`** instead (use the metric id as `aggregationId` when you rely on default KPI metadata).

Deprecation signaling (RFC 8594):

- Response header **`Deprecation: true`**
- Response header **`Link: <…/aggregations/<metricId>>; rel="alternate"`** (successor URL under the scorecard plugin mount, e.g. `/api/scorecard`)

The backend logs a **warning** when this route is used.

#### Path Parameters

| Parameter  | Type   | Required | Description                       |
| ---------- | ------ | -------- | --------------------------------- |
| `metricId` | string | Yes      | The ID of the metric to aggregate |

#### Authentication

Requires user authentication. The endpoint uses the authenticated user's entity reference to determine which entities to aggregate.

#### Permissions

Requires `scorecard.metric.read` permission. Additionally:

- The user must have access to the specific metric (returns `403 Forbidden` if access is denied)
- The user must have `catalog.entity.read` permission for each entity that will be included in the aggregation

#### Example Request

```bash
# Get aggregated metrics for a specific metric
curl -X GET "{{url}}/api/scorecard/metrics/github.open_prs/catalog/aggregations" \
  -H "Authorization: Bearer <token>"
```

#### Key Features

- **Metric Access Validation**: This endpoint explicitly validates that the user has access to the specified metric and returns `403 Forbidden` if access is denied
- **Empty Results Handling**: Returns an empty aggregation object (zero counts with a timestamp) when the user owns no entities

#### Error Handling

##### Missing User Entity Reference

If the authenticated user doesn't have an entity reference in the catalog:

- **Status Code**: `401 Unauthorized`
- **Error**: `AuthenticationError: User entity reference not found`

##### User Entity Not Found in the Catalog

If the user entity doesn't exist in the catalog.

- **Status Code**: `404 Not Found`
- **Error**: `NotFoundError: User entity not found in catalog`

#### Permission Denied

If the user doesn't have permission to read a specific entity:

- **Status Code**: `403 Forbidden`
- **Error**: Permission denied for the specific entity

#### Metric Access Denied (for `/metrics/:metricId/catalog/aggregations`)

If the user doesn't have access to the specified metric:

- **Status Code**: `403 Forbidden`
- **Error**: `NotAllowedError: To view the scorecard metrics, your administrator must grant you the required permission.`

## Best practices

1. **Prefer `GET /aggregations/:aggregationId`** and define stable KPI ids under **`scorecard.aggregationKPIs`** when you need custom titles or multiple logical cards over the same metric.
2. **Plan for removal** of `GET /metrics/:metricId/catalog/aggregations` - switch clients and proxies to **`GET /aggregations/:aggregationId`** using the same metric id when you do not define a KPI, or your KPI id from app-config (see the **`Link`** header on deprecated responses for the suggested URL).
3. **Handle Empty Results**: Always handle empty aggregations (zero counts) when the user owns no entities
4. **Group Structure**: Be aware of the direct parent group limitation when designing your group hierarchy. You currently receive scorecard results only for entities you own and those of your immediate parent group. To include results from _all_ parent
   groups, you can either implement custom logic, restructure your groups, or (if using RHDH), enable transitive parent groups ([see transitive parent group enablement documentation](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.5/html-single/authorization_in_red_hat_developer_hub/index#enabling-transitive-parent-groups)).

5. **Metric access**: Aggregation routes enforce **`scorecard.metric.read`** for the underlying metric and **`catalog.entity.read`** for each included entity; expect **`403 Forbidden`** when either check fails.

For RBAC, scheduling, full endpoint reference, and **app-config examples** for **`weightedStatusScore`** and **scalar** KPIs, see the [Scorecard backend README](../README.md).

For **per-entity threshold overrides** (annotations), **weightedStatusScore** and **scalar** KPI result thresholds, and expression reference, see [thresholds.md](./thresholds.md).
