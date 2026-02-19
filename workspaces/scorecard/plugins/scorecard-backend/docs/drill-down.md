# Entity Drill-Down

The Scorecard plugin provides a drill-down endpoint that returns detailed entity-level metrics with filtering, sorting, and pagination capabilities. This feature allows users to investigate the individual entities that contribute to aggregated scorecard metrics, enabling detailed analysis and troubleshooting.

## Overview

The drill-down endpoint (`/metrics/:metricId/catalog/aggregations/entities`) provides a detailed view of entities and their metric values. It allows managers and platform engineers to:

- See individual entities contributing to aggregated scores
- Filter entities by status (success/warning/error), owner, kind, or entity ref substring
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

| Parameter    | Type             | Required | Default     | Description                                                                                                                                                                                                       |
| ------------ | ---------------- | -------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `status`     | string           | No       | -           | Filter by threshold status: `success`, `warning`, or `error`                                                                                                                                                      |
| `owner`      | string/string\[] | No       | -           | Filter by owner entity ref. Repeat to supply multiple values (e.g., `?owner=a&owner=b`)                                                                                                                           |
| `kind`       | string           | No       | -           | Filter by entity kind (e.g., `Component`, `API`, `System`)                                                                                                                                                        |
| `entityName` | string           | No       | -           | Substring search against the entity ref (`kind:namespace/name`). Matches any part of the ref (case-insensitive). Use the name portion for simple searches (e.g., `auth` matches `component:default/auth-service`) |
| `sortBy`     | string           | No       | `timestamp` | Sort by: `entityName`, `owner`, `entityKind`, `timestamp`, or `metricValue`                                                                                                                                       |
| `sortOrder`  | string           | No       | `desc`      | Sort direction: `asc` or `desc`                                                                                                                                                                                   |
| `page`       | number           | No       | `1`         | Page number (1-indexed)                                                                                                                                                                                           |
| `pageSize`   | number           | No       | `5`         | Number of entities per page (max: 100)                                                                                                                                                                            |

#### Authentication

Requires user authentication.

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

Get entities owned by a specific team:

```bash
curl -X GET "{{url}}/api/scorecard/metrics/github.open_prs/catalog/aggregations/entities?owner=team:default/platform&page=1&pageSize=10" \
  -H "Authorization: Bearer <token>"
```

Get entities owned by multiple teams (repeat the `owner` parameter):

```bash
curl -X GET "{{url}}/api/scorecard/metrics/github.open_prs/catalog/aggregations/entities?owner=team:default/platform&owner=team:default/backend&page=1&pageSize=10" \
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

Get Component entities with errors for a specific team, sorted by metric value:

```bash
curl -X GET "{{url}}/api/scorecard/metrics/github.open_prs/catalog/aggregations/entities?owner=team:default/platform&status=error&kind=Component&sortBy=metricValue&sortOrder=desc&page=1&pageSize=10" \
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

### Status Filtering

When `status` is specified, only entities with that threshold evaluation are returned:

- `status=success`: Entities meeting success thresholds
- `status=warning`: Entities meeting warning thresholds
- `status=error`: Entities failing thresholds or in error state

Status filtering is performed at the database level for optimal performance.

### Owner Filtering

The `owner` parameter filters entities by their catalog owner (`spec.owner`). Repeat the parameter to match any of several owners (up to 50):

```bash
# Get entities owned by a specific team
?owner=team:default/platform

# Get entities owned by a specific user
?owner=user:default/alice

# Get entities owned by either of two teams
?owner=team:default/platform&owner=team:default/backend
```

This filter is applied at the database level for optimal performance. Frontends can implement "owned by me" scoping by passing the user's `identityApi.ownershipEntityRefs` (user ref + direct group refs) as repeated `owner` values.

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

The `entityName` parameter performs a case-insensitive substring search against the full entity reference, which has the format `kind:namespace/name` (e.g., `component:default/auth-service`).

```bash
# Match by name fragment — matches component:default/auth-service, api:default/auth-api, etc.
?entityName=auth

# Match by name fragment — matches component:default/my-service, component:default/service-api, etc.
?entityName=service

# Match more precisely using the full ref format
?entityName=component:default/auth-service
```

Because the search runs against the entire ref string, searching by just the name portion (the part after `/`) is the most common and natural usage. Be aware that the search term could also match the kind or namespace prefix if those happen to contain the search string (e.g., `?entityName=default` would match all entities in the `default` namespace).

Entity name filtering is performed at the database level for consistent pagination and accurate total counts.

## Sorting

Results can be sorted by any column in ascending or descending order. Sorting is applied at the database level, so the correct order is guaranteed across all pages regardless of which filters are active.

### Sort Options

| Sort By       | Description                                                                                    | Example Values                                         |
| ------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `entityName`  | Full entity ref (`kind:namespace/name`) alphabetically — equivalent to sorting by the full ref | "api:default/api-service", "component:default/web-app" |
| `owner`       | Owner entity reference alphabetically                                                          | "team:default/platform"                                |
| `entityKind`  | Entity kind alphabetically                                                                     | "API", "Component"                                     |
| `timestamp`   | Metric sync timestamp (most/least recent)                                                      | ISO 8601 timestamps                                    |
| `metricValue` | Metric value numerically (highest/lowest first)                                                | 5, 15, 25, 100                                         |

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

All filters (`status`, `owner`, `kind`, and `entityName`) and sorting (`sortBy`, `sortOrder`) are applied at the database level before pagination. The `ORDER BY` and `LIMIT`/`OFFSET` are always pushed to the database, so only the requested page of rows is fetched in the correct order regardless of which filters are active.

For best performance with large datasets, combine specific filters to reduce the result set size before paginating.

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

An engineer wants to see only their owned entities with issues. The frontend passes the user's `ownershipEntityRefs` (user ref + group memberships) as repeated `owner` params:

```bash
curl -X GET "{{url}}/api/scorecard/metrics/github.open_prs/catalog/aggregations/entities?owner=user:default/alice&owner=team:default/platform&page=1&pageSize=10" \
  -H "Authorization: Bearer <token>"
```

This returns a personalized view scoped to the entities the engineer and their teams are responsible for.

## Limitations

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

1. **Entity deleted from catalog**: Entity ref exists in metrics but entity was removed from the catalog
2. **Permission denied**: User lacks `catalog.entity.read` for that entity

**Resolution**: Check whether the entity still exists in the catalog and that the user has the appropriate read permissions.

### Catalog Unavailable

**Symptom**: Empty entity list despite knowing entities with metric data exist

**Possible causes**:

1. **Catalog API unreachable**: The endpoint could not contact the catalog to verify entity access. To protect against unauthorized data exposure, results are not returned when authorization cannot be confirmed.

**Resolution**: Check backend logs for `Failed to fetch entities from catalog` error entries and confirm the catalog service is healthy.

### Slow Responses

**Symptom**: Response times > 5 seconds

**Possible causes**:

1. **Large result set**: Too many entities match the filters
2. **No filters applied**: Returning all entities in the system

**Resolution**:

- Use more specific filters (status, kind, owner, entityName)
- Reduce page size
- Use the `owner` filter to scope results to specific teams

## Related Documentation

- [Entity Aggregation](./aggregation.md) - Parent aggregation endpoint that shows summary counts
- [Thresholds](./thresholds.md) - How threshold evaluation determines success/warning/error status
- [Metric Providers](./providers.md) - How metrics are collected and stored
