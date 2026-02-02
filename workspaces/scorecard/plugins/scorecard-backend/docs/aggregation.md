# Entity Aggregation

The Scorecard plugin provides an aggregation endpoint that returns metrics aggregated across all entities owned by the authenticated user. This feature allows users to get a consolidated view of metrics across their entire portfolio of owned entities.

## Overview

The aggregation endpoint (`/metrics/:metricId/catalog/aggregations`) aggregates metrics from multiple entities based on entity ownership. It collects metrics from:

- Entities directly owned by the user
- Entities owned by groups the user is a direct member of

The aggregation counts how many entities fall into each threshold category (`success`, `warning`, `error`) for each metric, providing a high-level overview of the health status across all owned entities.

### Important Limitation: Direct Parent Groups Only

**Only direct parent groups are considered.** The aggregation does not traverse nested group hierarchies.

**Example:**

Consider the following group structure:

- User `alice` is a member of `group:default/developers`
- `group:default/developers` is a member of `group:default/engineering`

In this case:

- ✅ Entities owned by `alice` directly are included
- ✅ Entities owned by `group:default/developers` are included
- ❌ Entities owned by `group:default/engineering` are **NOT** included

**Enabling Transitive Ownership:**

To include entities from all parent groups in the aggregation (not just direct parent groups), you can enable transitive parent groups. If you're using Red Hat Developer Hub (RHDH), you can enable transitive parent groups by following the [transitive parent group enablement documentation](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.5/html-single/authorization_in_red_hat_developer_hub/index#enabling-transitive-parent-groups). This will allow the aggregation to traverse nested group hierarchies and include entities from all parent groups in the hierarchy.

## API Endpoint

### `GET /metrics/:metricId/catalog/aggregations`

Returns aggregated metrics for a specific metric across all entities owned by the authenticated user. This endpoint is useful when you need to check access to a specific metric and get its aggregation without requiring the `metricIds` query parameter.

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

## Error Handling

### Missing User Entity Reference

If the authenticated user doesn't have an entity reference in the catalog:

- **Status Code**: `401 Unauthorized`
- **Error**: `AuthenticationError: User entity reference not found`

### User Entity Not Found in the Catalog

If the user entity doesn't exist in the catalog.

- **Status Code**: `404 Not Found`
- **Error**: `NotFoundError: User entity not found in catalog`

### Permission Denied

If the user doesn't have permission to read a specific entity:

- **Status Code**: `403 Forbidden`
- **Error**: Permission denied for the specific entity

### Metric Access Denied (for `/metrics/:metricId/catalog/aggregations`)

If the user doesn't have access to the specified metric:

- **Status Code**: `403 Forbidden`
- **Error**: `NotAllowedError: To view the scorecard metrics, your administrator must grant you the required permission.`

## Best Practices

1. **Handle Empty Results**: Always handle empty aggregations (zero counts) when the user owns no entities

2. **Group Structure**: Be aware of the direct parent group limitation when designing your group hierarchy. You currently receive scorecard results only for entities you own and those of your immediate parent group. To include results from _all_ parent
   groups, you can either implement custom logic, restructure your groups, or (if using RHDH), enable transitive parent groups ([see transitive parent group enablement documentation](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.5/html-single/authorization_in_red_hat_developer_hub/index#enabling-transitive-parent-groups)).

3. **Metric Access**: This endpoint validates metric access upfront, so you'll get a clear `403 Forbidden` error if the user doesn't have permission to view the specified metric
