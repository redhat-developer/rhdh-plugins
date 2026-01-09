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
- **Single Metric Only**: Returns aggregation for only the specified metric (no need for `metricIds` query parameter)
- **Empty Results Handling**: Returns an empty array `[]` when the user owns no entities, avoiding errors when filtering by a single metric

## Error Handling

### Missing User Entity Reference

If the authenticated user doesn't have an entity reference in the catalog:

- **Status Code**: `404 Not Found`
- **Error**: `NotFoundError: User entity reference not found`

### Permission Denied

If the user doesn't have permission to read a specific entity:

- **Status Code**: `403 Forbidden`
- **Error**: Permission denied for the specific entity

### Metric Access Denied (for `/metrics/:metricId/catalog/aggregations`)

If the user doesn't have access to the specified metric:

- **Status Code**: `403 Forbidden`
- **Error**: `NotAllowedError: To view the scorecard metrics, your administrator must grant you the required permission.`

### Invalid Query Parameters

If invalid query parameters are provided:

- **Status Code**: `400 Bad Request`
- **Error**: Validation error details

## Best Practices

1. **Handle Empty Results**: Always check for empty arrays when the user owns no entities

2. **Group Structure**: Be aware of the direct parent group limitation when designing your group hierarchy. If you need nested group aggregation, consider restructuring your groups or implementing custom logic

3. **Metric Access**: This endpoint validates metric access upfront, so you'll get a clear `403 Forbidden` error if the user doesn't have permission to view the specified metric
