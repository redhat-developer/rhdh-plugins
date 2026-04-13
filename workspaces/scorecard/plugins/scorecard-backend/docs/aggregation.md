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

## API Endpoint

### `GET /aggregations/:aggregationId`

Use this endpoint for all new integrations.

- **`aggregationId`** may be a key under **`scorecard.aggregationKPIs`** in app-config (see the [backend README](../README.md#aggregation-kpis-homepage-and-get-aggregations)), which supplies **title**, **description**, **type**, and **metricId**.
- If there is **no** KPI entry for that id, the backend treats **`aggregationId` as the metric id** and uses the default **statusGrouped** aggregation.

The response shape includes **`id`**, **`status`**, **`metadata`** (title, description, type, aggregation type), and **`result`** (counts per threshold rule, total, thresholds).

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

For RBAC, scheduling, and full endpoint reference, see the [Scorecard backend README](../README.md).
