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

**`statusGrouped`** loads each owned entity’s metric status, buckets entities by status key (success, warning, error, etc.), and returns **counts per status** summed across the portfolio. Use it when you want a breakdown of how many entities are in each state (for example a status pie chart).

**`average`** rolls up each owned entity’s metric into status keys, applies **`options.statusScores`** (weights per status key), and returns **one normalized score** in \[0, 1\] (one decimal), scaled against the metric’s threshold rules. Use it when you want a single “portfolio health” number (for example a donut gauge on the homepage).

| Type                | Output                                                                             | Typical use                                     |
| ------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------- |
| **`statusGrouped`** | Counts per status key across owned entities                                        | “How many entities are green vs red” style pie. |
| **`average`**       | **`averageScore`** in \[0, 1\] from weighted counts via **`options.statusScores`** | Portfolio health gauge from one headline score. |

For **`average`**:

1. The backend loads **status-grouped counts** for the configured **`metricId`** across the same **owned entities** scope as other aggregation KPIs.
2. **Weighted sum:** For each **status key** present in the aggregated counts, the contribution is **`count × weight`**. If a key appears in the data but has **no** entry in **`statusScores`**, the backend **warns** and uses weight **0** for that key. Any key present in **`statusScores`** can contribute to the sum if it appears in the stored counts (you should align keys with your metric’s threshold rules and **`statusScores`** to avoid surprising totals).
3. **Denominator and ratio:** Let **`maxWeight`** be the maximum of **`options.statusScores[rule.key]`** over each **`rule.key`** in the metric’s **merged threshold rules** (missing map entries are treated as **0** here). **`averageMaxPossible`** = **`maxWeight × total entities`**. If **`total`** is 0 or **`averageMaxPossible`** is 0, **`averageScore`** is **0**; otherwise **`averageScore`** = **`(weighted sum / averageMaxPossible)`** rounded to **one decimal place** (so the headline percentage **`averageScore × 100`** in the UI is not arbitrary-precision). The ratio can exceed **1.0** if **`statusScores`** assigns a weight above **`maxWeight`** to a status that still appears in the aggregated counts; keep **`statusScores`** aligned with your metric rules to avoid that.

**`options.thresholds`:** **number**-style rules (same shape as metric thresholds) evaluated against the **headline percentage** **`averageScore × 100`** (higher = better for typical setups). The first matching rule supplies **`result.aggregationChartDisplayColor`**. If omitted from **`scorecard.aggregationKPIs`**, it stays unset in the built KPI config; **`AverageAggregationStrategy`** then applies **`DEFAULT_AVERAGE_KPI_RESULT_THRESHOLDS`** from [`src/constants/aggregationKPIs.ts`](../src/constants/aggregationKPIs.ts) when each aggregation runs and logs **info** that the default 0–100% health scale is used: **<30%** = error, **30–79%** = warning, **≥80%** = success. Full detail: [thresholds.md — Aggregation KPI result thresholds](./thresholds.md#4-aggregation-kpi-result-thresholds-average-type) and [backend README — Aggregation KPIs](../README.md#aggregation-kpis-homepage-and-get-aggregations).

## Configuration validation

**`scorecard.aggregationKPIs`** is validated when the backend plugin starts. Invalid entries (unknown **`type`**, missing **`options`** for **`average`**, empty **`statusScores`**, unknown **`metricId`**, invalid threshold expressions, etc.) cause startup to **fail with an error** so misconfiguration is caught early. Fix app-config and redeploy.

Schema reference for config discovery (IDE / `backstage-cli config:schema`): see **`config.d.ts`** on the backend package (`aggregationKPIs` and nested **`options`**).

## API Endpoint

### `GET /aggregations/:aggregationId`

Use this endpoint for all new integrations.

- **`aggregationId`** may be a key under **`scorecard.aggregationKPIs`** in app-config (see the [backend README](../README.md#aggregation-kpis-homepage-and-get-aggregations)), which supplies **title**, **description**, **type**, **metricId**, and for **`type: average`** the **`options.statusScores`** map (threshold rule key → weight), with room for more **`options`** fields per type later.
- If there is **no** `scorecard.aggregationKPIs.<aggregationId>` block, the backend still responds successfully: it treats **`aggregationId` as the `metricId`** and uses the default **statusGrouped** strategy (same as calling **`/aggregations/<metricId>`** with a metric id). A **warning** is logged on the server so missing KPI config is visible in operator logs. To get a custom **title**, **`average`** type, or other KPI options, you must add that block; a typo in the id falls through to this default and can look like “wrong” aggregation behavior in the UI, so check logs and app-config.

The response shape includes **`id`**, **`status`**, **`metadata`** (title, description, type, aggregation type), and **`result`** (counts per threshold rule, total, thresholds). The **`result`** object also includes **`entitiesConsidered`** (count of in-scope owned entities that have **at least one** latest `metric_values` row for this metric) and **`calculationErrorCount`** (how many of those latest rows are metric calculation failures: `error_message` set and `value` null), so the homepage ratio matches the population behind the drill-down table rather than the raw number of owned catalog refs. For **`average`**, **`result`** also includes **`averageScore`** (ratio in \[0, 1\]), **`averageWeightedSum`**, and **`averageMaxPossible`** (see backend README). The homepage card shows a donut gauge for this type instead of a multi-slice status pie.

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

When the user owns no relevant entities, the API returns an aggregation with **zero total** and zeroed bucket counts (not an error).

### Drill-down vs aggregation id

The aggregation API uses **`aggregationId`** (KPI key or metric id). **Entity drill-down** remains **metric-scoped**: use **`GET /metrics/:metricId/catalog/aggregations/entities`** with the KPI’s **`metricId`**, not the KPI key. That applies to both **`statusGrouped`** and **`average`** KPIs. See [drill-down.md](./drill-down.md).

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

For RBAC, scheduling, full endpoint reference, and **app-config examples** for **`average`** KPIs (including **`thresholds`**), see the [Scorecard backend README](../README.md).

For **per-entity threshold overrides** (annotations), **average KPI result thresholds**, and expression reference, see [thresholds.md](./thresholds.md).
