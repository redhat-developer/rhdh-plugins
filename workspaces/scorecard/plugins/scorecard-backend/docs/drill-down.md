# Entity Drill-Down

The Scorecard plugin provides a drill-down endpoint that returns detailed entity-level metrics with filtering, sorting, and pagination capabilities. This feature allows users to investigate the individual entities that contribute to aggregated scorecard metrics, enabling detailed analysis and troubleshooting.

## Overview

The drill-down endpoint (`/metrics/:metricId/catalog/aggregations/entities`) provides a detailed view of entities and their metric values. It allows managers and platform engineers to:

- See individual entities contributing to aggregated scores
- Filter entities by status (success/warning/error), owner, kind, or name
- Sort by any column (entity name, owner, kind, timestamp, metric value)
- Paginate through large result sets
- Understand data freshness through per-entity timestamps

This endpoint transforms the scorecard from a passive reporting tool into an actionable diagnostic interface.

## API Endpoint

### `GET /metrics/:metricId/catalog/aggregations/entities`

Returns a paginated list of entities with their metric values, enriched with catalog metadata.

#### Path Parameters

| Parameter  | Type   | Required | Description                                    |
| ---------- | ------ | -------- | ---------------------------------------------- |
| `metricId` | string | Yes      | The ID of the metric (e.g., `github.open_prs`) |

#### Query Parameters

| Parameter    | Type    | Required | Default     | Description                                                                                  |
| ------------ | ------- | -------- | ----------- | -------------------------------------------------------------------------------------------- |
| `status`     | string  | No       | -           | Filter by threshold status: `success`, `warning`, or `error`                                 |
| `ownedByMe`  | boolean | No       | `false`     | If `true`, only show entities owned by the authenticated user and their direct parent groups |
| `owner`      | string  | No       | -           | Filter by specific owner entity ref (e.g., `team:default/platform`)                          |
| `kind`       | string  | No       | -           | Filter by entity kind (e.g., `Component`, `API`, `System`)                                   |
| `entityName` | string  | No       | -           | Search for entities with names containing this string (case-insensitive)                     |
| `sortBy`     | string  | No       | `timestamp` | Sort by: `entityName`, `owner`, `entityKind`, `timestamp`, or `metricValue`                  |
| `sortOrder`  | string  | No       | `desc`      | Sort direction: `asc` or `desc`                                                              |
| `page`       | number  | No       | `1`         | Page number (1-indexed)                                                                      |
| `pageSize`   | number  | No       | `5`         | Number of entities per page (max: 100)                                                       |

#### Authentication

Requires user authentication. The endpoint uses the authenticated user's entity reference when `ownedByMe=true` is specified.

#### Permissions

Requires `scorecard.metric.read` permission. Additionally:

- The user must have access to the specific metric (returns `403 Forbidden` if access is denied)
- The user must have `catalog.entity.read` permission for each entity that will be included in the results

#### Response Schema

```typescript
{
  metricId: string;
  metricMetadata: {
    title: string;
    description: string;
    type: 'number' | 'boolean';
  };
  entities: EntityMetricDetail[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

type EntityMetricDetail = {
  entityRef: string;              // Full entity reference (e.g., "component:default/my-service")
  entityName: string;             // Entity name from catalog
  entityKind: string;             // Entity kind (e.g., "Component", "API")
  owner: string;                  // Owner entity reference or name
  metricValue: number | boolean | null;  // The actual metric value
  timestamp: string;              // ISO 8601 timestamp of when metric was synced
  status: 'success' | 'warning' | 'error';  // Threshold evaluation status
};
```

## Usage Examples

### Basic Drill-Down

Get the first page of entities for a metric:

```bash
curl -X GET "{{url}}/api/scorecard/metrics/github.open_prs/catalog/aggregations/entities?page=1&pageSize=10" \
  -H "Authorization: Bearer <token>"
```

### Filter by Status

Get only entities in error state:

```bash
curl -X GET "{{url}}/api/scorecard/metrics/github.open_prs/catalog/aggregations/entities?status=error&page=1&pageSize=10" \
  -H "Authorization: Bearer <token>"
```

### Filter by Ownership

Get only entities owned by the authenticated user:

```bash
curl -X GET "{{url}}/api/scorecard/metrics/github.open_prs/catalog/aggregations/entities?ownedByMe=true&status=error" \
  -H "Authorization: Bearer <token>"
```

Get entities owned by a specific team:

```bash
curl -X GET "{{url}}/api/scorecard/metrics/github.open_prs/catalog/aggregations/entities?owner=team:default/platform&page=1&pageSize=10" \
  -H "Authorization: Bearer <token>"
```

### Filter by Entity Kind

Get only Component entities:

```bash
curl -X GET "{{url}}/api/scorecard/metrics/github.open_prs/catalog/aggregations/entities?kind=Component&page=1&pageSize=10" \
  -H "Authorization: Bearer <token>"
```

### Search by Entity Name

Search for entities with "service" in their name:

```bash
curl -X GET "{{url}}/api/scorecard/metrics/github.open_prs/catalog/aggregations/entities?entityName=service&page=1&pageSize=10" \
  -H "Authorization: Bearer <token>"
```

### Sorting

Sort by metric value (highest first):

```bash
curl -X GET "{{url}}/api/scorecard/metrics/github.open_prs/catalog/aggregations/entities?sortBy=metricValue&sortOrder=desc&page=1&pageSize=10" \
  -H "Authorization: Bearer <token>"
```

Sort by entity name alphabetically:

```bash
curl -X GET "{{url}}/api/scorecard/metrics/github.open_prs/catalog/aggregations/entities?sortBy=entityName&sortOrder=asc&page=1&pageSize=10" \
  -H "Authorization: Bearer <token>"
```

### Combining Filters

Get my Component entities with errors, sorted by metric value:

```bash
curl -X GET "{{url}}/api/scorecard/metrics/github.open_prs/catalog/aggregations/entities?ownedByMe=true&status=error&kind=Component&sortBy=metricValue&sortOrder=desc&page=1&pageSize=10" \
  -H "Authorization: Bearer <token>"
```

## Response Example

```json
{
  "metricId": "github.open_prs",
  "metricMetadata": {
    "title": "Open Pull Requests",
    "description": "Number of open pull requests in GitHub",
    "type": "number"
  },
  "entities": [
    {
      "entityRef": "component:default/my-service",
      "entityName": "my-service",
      "entityKind": "Component",
      "owner": "team:default/platform",
      "metricValue": 15,
      "timestamp": "2026-02-17T10:30:00Z",
      "status": "error"
    },
    {
      "entityRef": "component:default/another-service",
      "entityName": "another-service",
      "entityKind": "Component",
      "owner": "team:default/backend",
      "metricValue": 8,
      "timestamp": "2026-02-17T10:25:00Z",
      "status": "warning"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 42,
    "totalPages": 5
  }
}
```

## Filtering Behavior

### Entity Ownership Scoping

The `ownedByMe` parameter controls which entities are included in the results:

**Default (`ownedByMe` not specified or `false`)**: Returns all entities in the system that have metric values for the specified metric, subject to the user's catalog read permissions.

**`ownedByMe=true`**: Returns only entities owned by the authenticated user and their direct parent groups. This uses the same ownership logic as the aggregation endpoint (see [Entity Aggregation](./aggregation.md) for details on direct parent groups vs transitive ownership).

### Status Filtering

When `status` is specified, only entities with that threshold evaluation are returned:

- `status=success`: Entities meeting success thresholds
- `status=warning`: Entities meeting warning thresholds
- `status=error`: Entities failing thresholds or in error state

Status filtering is performed at the database level for optimal performance.

### Owner Filtering

The `owner` parameter filters entities by their catalog owner (`spec.owner`):

```bash
# Get entities owned by a specific team
?owner=team:default/platform

# Get entities owned by a specific user
?owner=user:default/alice
```

This filter is applied at the database level and works independently of `ownedByMe`.

### Kind Filtering

Filter by entity kind to narrow results to specific entity types:

```bash
# Only Components
?kind=Component

# Only APIs
?kind=API

# Only Systems
?kind=System
```

Kind filtering is performed at the database level for optimal performance.

### Entity Name Search

The `entityName` parameter performs a case-insensitive substring search on entity names:

```bash
# Find entities with "auth" in the name
?entityName=auth

# Find entities with "service" in the name
?entityName=service
```

Entity name filtering requires catalog metadata and is performed at the application level after enrichment.

## Sorting

Results can be sorted by any column in ascending or descending order:

### Sort Options

| Sort By       | Description                                     | Example Values           |
| ------------- | ----------------------------------------------- | ------------------------ |
| `entityName`  | Entity name alphabetically                      | "api-service", "web-app" |
| `owner`       | Owner entity reference alphabetically           | "team:default/platform"  |
| `entityKind`  | Entity kind alphabetically                      | "API", "Component"       |
| `timestamp`   | Metric sync timestamp (most/least recent)       | ISO 8601 timestamps      |
| `metricValue` | Metric value numerically (highest/lowest first) | 5, 15, 25, 100           |

### Default Sorting

If no `sortBy` is specified, results are sorted by `timestamp` in descending order (most recent first).

### Null Value Handling

When sorting by `metricValue`, entities with `null` values are sorted to the end regardless of sort order.

## Pagination

The endpoint uses offset-based pagination:

- **Default page size**: 5 entities
- **Maximum page size**: 100 entities
- **Page numbering**: 1-indexed (first page is `page=1`)

The response includes pagination metadata:

```json
{
  "pagination": {
    "page": 1, // Current page
    "pageSize": 10, // Entities per page
    "total": 42, // Total matching entities across all pages
    "totalPages": 5 // Total number of pages
  }
}
```

### Pagination Performance

- **Database-level pagination**: Used when only `status`, `owner`, or `kind` filters are applied (optimal performance)
- **Application-level pagination**: Used when `entityName` search is applied (fetches all results, then filters and paginates in memory)

For best performance with large datasets, use database-level filters when possible.

## Error Handling

### Invalid Metric ID

If the specified metric does not exist:

- **Status Code**: `404 Not Found`
- **Error**: `NotFoundError: Metric not found`

### Missing User Entity Reference

If the authenticated user doesn't have an entity reference:

- **Status Code**: `401 Unauthorized`
- **Error**: `AuthenticationError: User entity reference not found`

### Permission Denied

If the user doesn't have access to the metric:

- **Status Code**: `403 Forbidden`
- **Error**: `NotAllowedError: To view the scorecard metrics, your administrator must grant you the required permission.`

### Invalid Query Parameters

If query parameters are invalid (e.g., `pageSize > 100`):

- **Status Code**: `400 Bad Request`
- **Error**: Description of the validation error

### Empty Results

When no entities match the filters:

- **Status Code**: `200 OK`
- **Response**: Empty entities array with `total: 0`

```json
{
  "metricId": "github.open_prs",
  "metricMetadata": { ... },
  "entities": [],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

## Data Freshness

Each entity includes a `timestamp` field indicating when the metric value was last synced. This helps users understand data recency and identify stale metrics.

The timestamp represents when the metric provider last successfully fetched and evaluated the metric for that specific entity. Timestamps may vary across entities depending on:

- When entities were added to the catalog
- Individual metric sync schedules
- Failures or errors in previous sync attempts

## Use Cases

### Use Case 1: Identify Services in Error State

A manager sees an aggregated scorecard showing 50 entities with errors. They drill down to see which specific services need attention:

```bash
curl -X GET "{{url}}/api/scorecard/metrics/github.open_prs/catalog/aggregations/entities?status=error&sortBy=metricValue&sortOrder=desc&page=1&pageSize=20" \
  -H "Authorization: Bearer <token>"
```

This returns the 20 entities with the most severe issues (highest metric values in error state).

### Use Case 2: Review Team-Specific Metrics

A team lead wants to see only their team's entities:

```bash
curl -X GET "{{url}}/api/scorecard/metrics/jira.open_issues/catalog/aggregations/entities?owner=team:default/backend&sortBy=timestamp&sortOrder=asc" \
  -H "Authorization: Bearer <token>"
```

This shows the team's entities sorted by staleness (oldest data first), helping identify entities that may need attention.

### Use Case 3: Audit Specific Entity Type

An architect wants to review all API entities:

```bash
curl -X GET "{{url}}/api/scorecard/metrics/openssf.score/catalog/aggregations/entities?kind=API&status=warning&page=1&pageSize=25" \
  -H "Authorization: Bearer <token>"
```

This returns API entities with security warnings, helping prioritize security improvements.

### Use Case 4: Personal Dashboard

An engineer wants to see only their owned entities with issues:

```bash
curl -X GET "{{url}}/api/scorecard/metrics/github.open_prs/catalog/aggregations/entities?ownedByMe=true&page=1&pageSize=10" \
  -H "Authorization: Bearer <token>"
```

This returns a personalized view of entities they're responsible for.

## Limitations

### Direct Parent Groups Only (when using `ownedByMe=true`)

Similar to the aggregation endpoint, `ownedByMe=true` only includes entities owned by direct parent groups, not nested hierarchies. See [Entity Aggregation](./aggregation.md) for details on enabling transitive parent groups.

### Entity Metadata Freshness

Entity metadata (name, kind, owner) is fetched from the catalog at request time and reflects the current state. However, metric values and timestamps represent historical data from the last sync. This means:

- If an entity was renamed, the new name appears
- If ownership changed, the new owner appears
- But the metric value and timestamp are from the last sync, not re-calculated

## Troubleshooting

### Empty Results

**Symptom**: `total: 0` even though aggregation shows entities in that category

**Possible causes**:

1. **Stale aggregation data**: Aggregation was cached, entities have since changed status
2. **Permission changes**: User lost access to entities between viewing aggregation and drill-down
3. **Incorrect filters**: Check filter parameters match the aggregation criteria

### Missing Entity Metadata

**Symptom**: Entities show "Unknown" for name, kind, or owner

**Possible causes**:

1. **Entity deleted from catalog**: Entity ref exists in metrics but entity removed
2. **Permission denied**: User lacks `catalog.entity.read` for that entity
3. **Catalog API error**: Temporary failure fetching catalog metadata

**Resolution**: Check console logs for warnings about failed entity fetches.

### Slow Responses

**Symptom**: Response times > 5 seconds

**Possible causes**:

1. **Large result set**: Too many entities match the filters
2. **Entity name search**: Using `entityName` filter fetches all entities before filtering
3. **No filters applied**: Returning all entities in the system

**Resolution**:

- Use more specific filters (status, kind, owner)
- Reduce page size
- Avoid `entityName` search on large datasets
- Consider using `ownedByMe=true` to scope results

## Related Documentation

- [Entity Aggregation](./aggregation.md) - Parent aggregation endpoint that shows summary counts
- [Thresholds](./thresholds.md) - How threshold evaluation determines success/warning/error status
- [Metric Providers](./providers.md) - How metrics are collected and stored
