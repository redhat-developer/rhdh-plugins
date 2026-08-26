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
      metricId: jira.openIssues
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
      metricId: github.openPRs
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
4. **Metric type rules:** `sum`, `average`, `max`, and `min` require a **number** metric. `count` is also valid for boolean metrics. Startup validation rejects non-count scalar KPIs that target a boolean metric.
5. **Optional result thresholds:** `options.thresholds` (number-style rules) can color or classify the aggregated **`value`**. When omitted, the API returns **`DEFAULT_NUMBER_THRESHOLDS`**. See [thresholds.md — Aggregation KPI result thresholds (scalar types)](./thresholds.md#5-aggregation-kpi-result-thresholds-scalar-types).
6. **Optional status filter:** Top-level **`filter.status`** restricts which latest rows contribute to **`value`** / **`total`**. See [Status filter (scalar types)](#status-filter-scalar-types).

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
      metricId: jira.openIssues
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
    # Optional filter.status: only include entities whose metric status matches
    totalCriticalBugs:
      title: 'Total Critical Bugs'
      description: 'Sum of open issues for entities in error status.'
      type: sum
      metricId: jira.openIssues
      filter:
        status: error
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
      metricId: github.openPRs
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
      metricId: github.openPRs
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
      metricId: github.openPRs
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
      metricId: jira.openIssues
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

### Status filter (scalar types)

Scalar KPIs may include an optional top-level **`filter.status`** to restrict aggregation to latest rows whose threshold evaluation matches the given status key (for example `success`, `warning`, `error`, or any custom threshold key). On non-scalar types (`statusGrouped`, `weightedStatusScore`), **`filter`** is silently ignored.

**Startup validation:** When **`filter.status`** is set, the backend validates at plugin load that the value is a **threshold rule key** for the KPI’s **`metricId`** (provider defaults plus app-config at **`scorecard.metricProviders.<datasource>.<providerName>.metrics.<metricName>.thresholds`** or provider-level **`scorecard.metricProviders.<datasource>.<providerName>.thresholds`** — for example `scorecard.metricProviders.jira.openIssues.metrics.openIssues.thresholds` when **`metricId`** is `jira.openIssues`). Keys are **case-sensitive** (`error` ≠ `Error`) and must be 1–64 characters. Invalid keys cause startup to fail with an error listing valid keys. Per-entity annotation threshold overrides are **not** considered (they apply at metric sync time only). See [thresholds.md — Scalar status filter](./thresholds.md#5-aggregation-kpi-result-thresholds-scalar-types).

## Default aggregation

You do not need a KPI block for every metric. If the aggregation id is **not** a key under **`scorecard.aggregationKPIs`**, Scorecard treats it as a **metric id** (for example `github.openPRs`). Title and description for aggregation come from the metric itself.

The aggregation type is then:

- **`average`** when the metric’s **`defaultVisualization`** is **`sparkline`**
- **`statusGrouped`** otherwise

The Scorecard **backend plugin logger** logs an **info** the first time an aggregation id is resolved with no matching KPI.

```text
No "scorecard.aggregationKPIs.dora.deploymentFrequency" block in app-config; using default type "average" with metricId="dora.deploymentFrequency" (same as aggregation id). Add a KPI entry if you meant a custom title, description, or type.
```

Add a **`scorecard.aggregationKPIs`** entry when you need a custom title, a different type (for example **`sum`** or **`weightedStatusScore`**), **`filter`**, or **`options`**:

```yaml
scorecard:
  aggregationKPIs:
    avgDeploymentFrequency:
      title: Average Deployment Frequency
      description: This KPI provides average weekly production deploys over a 30-day window per entity.
      type: average
      metricId: dora.deploymentFrequency
```

This default applies to **`GET /aggregations/:aggregationId`**, **`GET /aggregations/:aggregationId/time-series`**, and **`GET /aggregations/:aggregationId/metadata`**. Time-series only accepts scalar types, so a default **`statusGrouped`** metric id returns **`400`**; a sparkline metric’s default **`average`** works without extra config.

**Homepage cards** are configured in the app (for example Dynamic Home Page mount points). They should pass **`aggregationId`** matching a key in `aggregationKPIs` or the metric id for the default case. See the [Scorecard frontend plugin README](../../scorecard/README.md#homepage-scorecard-cards).

## Configuration validation

- **`scorecard.aggregationKPIs`** is validated when the backend plugin starts. Invalid entries cause startup to fail with an error so misconfiguration is caught early. Fix app-config and redeploy.

- For aggregation types that support **`options.thresholds`**, threshold rules must satisfy the same **number interval / gap** rules as metric thresholds when multiple rules apply (union must cover the full real line with no gaps). Errors mention an approximate **first uncovered region**. See [Joint coverage (number metrics)](./thresholds.md#joint-coverage-number-metrics).

## API Endpoint

### `GET /aggregations/:aggregationId`

Returns a **KPI snapshot**: the current aggregated value of a scorecard KPI across entities you own.
Use this endpoint for all new integrations.

- **`aggregationId`** may be a key under **`scorecard.aggregationKPIs`** in app-config (see the [backend README](../README.md#aggregation-kpis-homepage-and-get-aggregations)), which supplies **title**, **description**, **type**, **metricId**, and type-specific **`options`** (for example **`options.statusScores`** for **`weightedStatusScore`**, or optional **`options.thresholds`** for scalar types and **`weightedStatusScore`**).
- If there is **no** `scorecard.aggregationKPIs.<aggregationId>` block, the backend still responds successfully: it treats **`aggregationId` as the `metricId`**. The default type is **`average`** when the metric’s **`defaultVisualization`** is **`sparkline`**, otherwise **`statusGrouped`**. A **warning** is logged on the server so missing KPI config is visible in operator logs. To get a custom **title**, **`weightedStatusScore`** or **scalar** type, or other KPI options, you must add that block; a typo in the id falls through to this default and can look like “wrong” aggregation behavior in the UI, so check logs and app-config.

The response shape includes **`id`**, **`status`**, **`metadata`** (title, description, type, unit, visualization, aggregation type, and **`filter`** when configured), and **`result`**. The shape of **`result`** depends on the aggregation type:

- **`statusGrouped`**: counts per threshold rule, **`total`**, **`thresholds`**, **`entitiesConsidered`**, **`calculationErrorCount`**, **`timestamp`**.
- **`weightedStatusScore`**: same as status-grouped, plus **`weightedStatusScore`** (portfolio percentage in \[0, 100\], one decimal), **`weightedStatusSum`**, **`weightedStatusMaxPossible`**, and **`aggregationChartDisplayColor`** (see backend README). The homepage card shows a donut gauge for this type instead of a multi-slice status pie.
- **Scalar types** (`sum`, `average`, `max`, `min`, `count`): see [Scalar result fields](#scalar-result-fields) below. When **`filter.status`** is configured, **`metadata.filter`** is also returned.

For a daily history of a **scalar** KPI over owned entities, see [`GET /aggregations/:aggregationId/time-series`](#get-aggregationsaggregationidtime-series).

### Scalar result fields

When **`metadata.aggregationType`** is one of **`sum`**, **`average`**, **`max`**, **`min`**, or **`count`**, **`result`** is a scalar aggregation payload:

| Field                       | Description                                                                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`value`**                 | Aggregated number from the KPI type (`sum` / `average` / `max` / `min` / `count`) over contributing latest non-null rows. Classified by **`options.thresholds`** when present. |
| **`total`**                 | How many latest rows contributed to **`value`** (non-null, calculation failures excluded, optionally narrowed by **`filter.status`**). For **`count`**, equals **`value`**.    |
| **`entitiesConsidered`**    | Owned entities in scope that have at least one latest row for this metric (includes calculation-error rows).                                                                   |
| **`calculationErrorCount`** | Among **`entitiesConsidered`**, how many latest rows are metric calculation failures (`error_message` set and `value` null).                                                   |
| **`timestamp`**             | Portfolio data freshness — ISO timestamp of the most recent latest row in scope (same merge rule as other aggregation types).                                                  |
| **`thresholds`**            | Number-style rules for classifying **`value`**; from **`options.thresholds`** or **`DEFAULT_NUMBER_THRESHOLDS`** when omitted.                                                 |

Example scalar response with status filter:

```json
{
  "id": "jira.openIssues",
  "status": "success",
  "metadata": {
    "title": "Total Critical Bugs",
    "description": "Sum of open issues for entities in error status",
    "type": "number",
    "aggregationType": "sum",
    "filter": { "status": "error" }
  },
  "result": {
    "value": 42,
    "total": 10,
    "entitiesConsidered": 10,
    "calculationErrorCount": 1,
    "timestamp": "2026-02-17T10:30:00.000Z",
    "thresholds": {
      "rules": [
        { "key": "success", "expression": "<100" },
        { "key": "warning", "expression": "100-500" },
        { "key": "error", "expression": ">500" }
      ]
    }
  }
}
```

**“Without calculation errors” on the homepage:** `healthy = entitiesConsidered - calculationErrorCount` counts only among entities that already have a latest stored row for this metric. Owned entities with **no** row yet are omitted from **`entitiesConsidered`** (same as omitting them from the drill-down list until data exists). The homepage ratio matches the population behind the drill-down table rather than the raw number of owned catalog refs.

**Partial totals:** The drill-down entities list can cap how many DB rows are considered and exposes **`entityHealth.countsArePartial`** when that cap applies. The aggregation path runs over the **full** list of owned catalog entity refs supplied to the query (there is no equivalent row cap), so **`entitiesConsidered`** / **`calculationErrorCount`** on **`GET /aggregations/:aggregationId`** are not marked partial in the same way.

#### Interpreting scalar results

Always read **`value`** together with **`total`**. When nothing contributed, SQL aggregates (`SUM` / `AVG` / `MIN` / `MAX`) return null over an empty set and the API coerces that to **`value: 0`** with **`total: 0`**. That shape means **no data**, not a real aggregate of zero — especially important for **`min`** / **`max`**, where a bare **`value: 0`** would otherwise look like a real extreme.

| What you see                                | What it means                                                                                                                                                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`value: 0`**, **`total: 0`**              | Empty contribution set: no owned entities in scope, or **`filter.status`** matched no latest rows. Not an API error. For **`min`** / **`max`**, do **not** treat this as a real extreme of **`0`**.          |
| **`value: 0`**, **`total: N`** (N > 0)      | Real zero aggregate over **N** contributing entities (for example **N** owned components in **`error`** status each with metric value **`0`** → **`min`** / **`sum`** / **`average`** can be **`0`**).       |
| **`value: 42`**, **`total: 10`**            | Aggregate over 10 contributing rows (for example sum of open issues across 10 matching entities).                                                                                                            |
| **`total`** vs **`entitiesConsidered`**     | **`total`** can be lower than **`entitiesConsidered`** when some latest rows are calculation failures and/or when **`filter.status`** excludes rows. Failures never contribute to **`value`** / **`total`**. |
| **`count`** type                            | **`value`** always equals **`total`** (both are the count of contributing rows).                                                                                                                             |
| **`timestamp`** when filter matches nothing | Still portfolio freshness from latest rows in scope — not “now”.                                                                                                                                             |

**Worked example** — KPI type **`min`** on **`github.openPRs`** with **`filter.status: error`**:

- Response **`{ "value": 0, "total": 5 }`** means you own 5 components currently in **`error`** status whose open-PR values contributed, and the minimum among them is **`0`**.
- Response **`{ "value": 0, "total": 0 }`** means no **`error`**-status rows contributed — show “no data”, not “min is 0”.

### `GET /aggregations/:aggregationId/time-series`

Returns a **daily history** of a **scalar** KPI (`sum`, `average`, `max`, `min`, `count`) across entities you own.

Each response point is one UTC day: Scorecard takes **latest stored row** for each owned entity that day (including calculation failures), then rolls successful values up with the KPI’s aggregation type. UTC days with no rows are omitted; a day with only failures is included with **`value: null`**, **`status: error`** and **`errors`** list.

If the KPI has optional **`filter.status`**, only successes whose stored **`status`** matches that key contribute to **`value`**. Calculation errors are still included on the point.

Only [scalar](#scalar-types) KPIs are supported. **`statusGrouped`** and **`weightedStatusScore`** return **`400 Bad Request`**. A metric id with no KPI block defaults to **`statusGrouped`** unless the metric’s **`defaultVisualization`** is **`sparkline`** (then **`average`**).

#### Path parameters

| Parameter       | Type   | Required | Description                                                                                        |
| --------------- | ------ | -------- | -------------------------------------------------------------------------------------------------- |
| `aggregationId` | string | Yes      | KPI key under **`scorecard.aggregationKPIs`**, or a **metric id** when no KPI block is configured. |

#### Query parameters

| Parameter | Type   | Required | Description                                                                                                             |
| --------- | ------ | -------- | ----------------------------------------------------------------------------------------------------------------------- |
| `from`    | string | Yes      | Inclusive range start (ISO-8601 datetime, for example `2024-01-01T00:00:00.000Z`).                                      |
| `to`      | string | Yes      | Inclusive range end (ISO-8601 datetime). Must be **greater than or equal to** **`from`**. Maximum span is **365 days**. |

Invalid or missing query parameters return **`400 Bad Request`** (`InputError`).

#### Permissions

Requires:

- **`scorecard.metric.read`** on the KPI's underlying metric
- **`catalog.entity.read`** for each entity included in the aggregation

#### Error handling

| Condition                     | Status             | Notes                                                                         |
| ----------------------------- | ------------------ | ----------------------------------------------------------------------------- |
| Metric access denied          | `403 Forbidden`    | User cannot read the metric                                                   |
| Missing credentials           | `401 Unauthorized` | `AuthenticationError`                                                         |
| Missing user entity reference | `401 Unauthorized` | `AuthenticationError`                                                         |
| Invalid query params          | `400 Bad Request`  | Format `ISO-8601`, `from` <= `to`, maximum span is 365 days                   |
| Unsupported aggregation type  | `400 Bad Request`  | `statusGrouped` and `weightedStatusScore` aggregation types are not supported |

#### Response

| Field                              | Description                                                                                                                                                                                                                                                                         |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`id`**                           | Aggregation id (KPI key or metric id).                                                                                                                                                                                                                                              |
| **`metricId`**                     | Backing metric id.                                                                                                                                                                                                                                                                  |
| **`metadata`**                     | Same metadata as the snapshot route (`title`, `description`, `type`, `unit`, `visualization`, `aggregationType`, and `filter` when configured).                                                                                                                                     |
| **`points`**                       | List of UTC days that have at least one stored row. Each point has **`value`** (or **`null` when `successCount` is 0**), **`successCount`**, **`errorCount`**, **`total`**, **`status`** (`success` / `error`), optional **`errors`**, and **`timestamp`** (start of that UTC day). |
| **`thresholds`**                   | Number-style rules for classifying **`value`**; from KPI **`options.thresholds`** or **`DEFAULT_NUMBER_THRESHOLDS`** when omitted. Not entity annotation overrides.                                                                                                                 |
| **`aggregationChartDisplayColor`** | Color of the sparkline stroke from the **last successful** point’s matching threshold rule **`color`**. **`null`** when no day has a value or the matching rule has no **`color`**.                                                                                                 |

#### How each day is computed

- **Latest sample per entity per UTC day:** the stored row with the highest `id` that day, **including calculation failures**.
- **`successCount` / `value`:** entities whose latest row that day has a real value. Optional **`filter.status`** applies only to these successes.
- **`errorCount` / `errors`:** entities whose latest row that day is a calculation failure (`error_message` set and value missing). **`errors`** lists unique messages with how many entities reported each. It is **omitted** when there are none.
- **`status`:** `success` if `successCount > 0`; `error` if only calculation failures. **`value`** is **`null`** unless `status` is `success`.
- **`total`:** `successCount + errorCount` (entities that reported that day). Homepage scorecard entities current health is reported from the **last point** in `points` (`successCount` / `total`).

#### Empty / missing days

- **`points` is sparse:** UTC days with **no stored rows** are omitted. The UI treats a gap in `[from, to]` as no data.
- A day with only calculation errors **is** included (`status: 'error'`, **`value: null`**, **`errors`**).
- No owned entities, or no rows in range: **`200`** with **`points: []`**.

#### Example request and response

KPI configuration:

```yaml
scorecard:
  aggregationKPIs:
    avgDeploymentFrequency:
      title: Average Deployment Frequency
      description: This KPI provides average weekly production deploys over a 30-day window per entity.
      type: average
      metricId: dora.deploymentFrequency
      options:
        thresholds:
          rules:
            - key: elite
              expression: '>=7'
              color: success.main
              icon: scorecardSuccessStatusIcon
            - key: medium
              expression: '1-7'
              color: warning.main
              icon: scorecardWarningStatusIcon
            - key: error
              expression: '<1'
              color: error.main
              icon: scorecardErrorStatusIcon
      # Optional status filter
      # filter:
      #   status: elite
```

```bash
curl -X GET "{{url}}/api/scorecard/aggregations/avgDeploymentFrequency/time-series?from=2026-08-24T00:00:00.000Z&to=2026-08-24T23:59:59.999Z" \
  -H "Authorization: Bearer <token>"
```

Latest data for **2026-08-24** per entity: successes `10` (elite), `14` (elite), `3` (medium), `0.2` (low); errors `timeout` ×1 and `GitHub API error` ×2.

| KPI                           | `value`                     | `successCount` | `errorCount` | `total` | `status` | `errors`    |
| ----------------------------- | --------------------------- | -------------- | ------------ | ------- | -------- | ----------- |
| `avgDeploymentFrequency`      | `(10+14+3+0.2)/4` = **6.8** | 4              | 3            | 7       | `medium` | both errors |
| `avgEliteDeploymentFrequency` | `(10+14)/2` = **12**        | 2              | 3            | 5       | `elite`  | both errors |

Example response for KPI without filter and one UTC day 2026-08-24:

```json
{
  "id": "avgDeploymentFrequency",
  "metricId": "dora.deploymentFrequency",
  "metadata": {
    "title": "Average Deployment Frequency",
    "description": "This KPI provides average weekly production deploys over a 30-day window per entity.",
    "type": "number",
    "unit": "/week",
    "history": true,
    "visualization": "sparkline",
    "aggregationType": "average"
  },
  "points": [
    {
      "value": 6.8,
      "successCount": 4,
      "errorCount": 3,
      "total": 7,
      "status": "success",
      "timestamp": "2026-08-24T00:00:00.000Z",
      "errors": [
        { "message": "GitHub API error", "count": 2 },
        { "message": "timeout", "count": 1 }
      ]
    }
  ],
  "thresholds": {
    "rules": [
      {
        "key": "elite",
        "expression": ">=7",
        "color": "success.main",
        "icon": "scorecardSuccessStatusIcon"
      },
      {
        "key": "medium",
        "expression": "1-7",
        "color": "warning.main",
        "icon": "scorecardWarningStatusIcon"
      },
      {
        "key": "error",
        "expression": "<1",
        "color": "error.main",
        "icon": "scorecardErrorStatusIcon"
      }
    ]
  },
  "aggregationChartDisplayColor": "warning.main" // from value of last successful point classified againts KPI thresholds
}
```

### `GET /aggregations/:aggregationId/metadata`

Same **`aggregationId`** resolution as [`GET /aggregations/:aggregationId`](#get-aggregationsaggregationid), but returns only metadata (no aggregate counts or time-series points), including **`filter`** when configured on a scalar KPI. Use this for UIs that list KPIs without loading full aggregation data.

#### Path parameters

| Parameter       | Type   | Required | Description                                                                                        |
| --------------- | ------ | -------- | -------------------------------------------------------------------------------------------------- |
| `aggregationId` | string | Yes      | KPI key under **`scorecard.aggregationKPIs`**, or a **metric id** when no KPI block is configured. |

#### Permissions and errors

- **`scorecard.metric.read`** on the underlying metric, and **`catalog.entity.read`** for each entity included in the aggregation.
- **Metric access denied**: `403 Forbidden` if the user cannot read the metric.
- **Missing user entity reference**: `401 Unauthorized` (`AuthenticationError`).
- **User not in catalog**: `404 Not Found` when applicable.
- **Per-entity denial**: `403 Forbidden` if the user cannot read a specific owned entity.

#### Empty results

When the user owns no relevant entities, snapshot distribution types (**`statusGrouped`**, **`weightedStatusScore`**) return **zero total** and zeroed bucket counts (not an error). For scalar empty / filtered-empty handling — including why **`value: 0`** with **`total: 0`** is ambiguous for **`min`** / **`max`** — see [Interpreting scalar results](#interpreting-scalar-results). Scalar time-series **omits** UTC days with no rows (`points` may be `[]`).

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
curl -X GET "{{url}}/api/scorecard/metrics/github.openPRs/catalog/aggregations" \
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

5. **Metric access**: Aggregation snapshot and time-series routes enforce **`scorecard.metric.read`** for the underlying metric and **`catalog.entity.read`** for each included entity; expect **`403 Forbidden`** when either check fails.

For RBAC, scheduling, full endpoint reference, and **app-config examples** for **`weightedStatusScore`** and **scalar** KPIs, see the [Scorecard backend README](../README.md).

For **per-entity threshold overrides** (annotations), **weightedStatusScore** and **scalar** KPI result thresholds, and expression reference, see [thresholds.md](./thresholds.md).
