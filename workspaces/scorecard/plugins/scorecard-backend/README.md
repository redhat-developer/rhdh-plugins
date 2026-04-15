# Scorecard backend plugin

Provides customizable metrics and scoring capabilities from various data sources for software components in the Backstage catalog.

## Installation

This plugin is installed via the `@red-hat-developer-hub/backstage-plugin-scorecard-backend` package. To install it to your backend package, run the following command:

```bash
# From your root directory
yarn --cwd packages/backend add @red-hat-developer-hub/backstage-plugin-scorecard-backend
```

Then add the plugin to your backend in `packages/backend/src/index.ts`:

```ts
const backend = createBackend();
// ...
backend.add(
  import('@red-hat-developer-hub/backstage-plugin-scorecard-backend'),
);
```

## RBAC permissions

Scorecard plugin provides the following permissions:

| Name                  | Resource Type    | Policy | Description                               | Requirements        |
| --------------------- | ---------------- | ------ | ----------------------------------------- | ------------------- |
| scorecard.metric.read | scorecard-metric | read   | Allows the user to read scorecard metrics | catalog.entity.read |

### `scorecard.metric.read`

- **Description**: Allows the user to read scorecard metrics
- **Resource Type**: `scorecard-metric`
- **Action**: `read`

This permission controls access to viewing scorecard metrics for entities.

#### Condition `HAS_METRIC_ID`

- Optionally allow access to only specific metrics by their identifiers.

**Example RBAC policies file configuration:**

```csv rbac-policy.csv
g, user:default/<YOUR_USERNAME>, role:default/scorecard-viewer
p, role:default/scorecard-viewer, scorecard.metric.read, read, allow
```

**Example RBAC conditional policies file configuration:**

```YAML rbac-conditions.yaml
---
result: CONDITIONAL
roleEntityRef: "role:default/scorecard-viewer"
pluginId: scorecard
resourceType: scorecard-metric
permissionMapping:
  - read
conditions:
  rule: HAS_METRIC_ID
  resourceType: scorecard-metric
  params:
    metricIds: ['github.open_prs']
```

This policy would allow users to read only the GitHub Open PRs metric, while restricting access to other available metrics.

## Metric Providers

The Scorecard plugin collects metrics from third-party data sources using metric providers. The Scorecard node plugin provides `scorecardMetricsExtensionPoint` extension point that is used to connect your backend plugin module that exports custom metrics via metric providers to the Scorecard backend plugin. For detailed information on creating metric providers, see [providers.md](./docs/providers.md).

### Metric Collection Scheduling

The Scorecard plugin automatically collects metrics on a scheduled basis. You can customize the schedule for any metric provider in your `app-config.yaml`. If no schedule is configured, metric providers use the following default schedule:

```yaml
schedule:
  frequency: { hours: 1 }
  timeout: { minutes: 15 }
  initialDelay: { minutes: 1 }
```

For more information about schedule configuration options, see the [Metric Collection Scheduling](./docs/providers.md#metric-collection-scheduling) section in providers.md.

### Available Metric Providers

The following metric providers are available:

| Provider       | Metric ID              | Title                       | Description                                                                                                                      | Type    |
| -------------- | ---------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------- |
| **GitHub**     | `github.open_prs`      | GitHub open PRs             | Count of open Pull Requests in GitHub                                                                                            | number  |
| **GitHub**     | `github.files_check.*` | GitHub File Checks          | Checks whether specific files (e.g., `README.md`, `LICENSE`, `CODEOWNERS`) exist in a repository.                                | boolean |
| **Jira**       | `jira.open_issues`     | Jira open issues            | The number of opened issues in Jira                                                                                              | number  |
| **OpenSSF**    | `openssf.*`            | OpenSSF Security Scorecards | 18 security metrics from OpenSSF Scorecards (e.g., `openssf.code_review`, `openssf.maintained`). Each returns a score from 0-10. | number  |
| **Dependabot** | `dependabot.*`         | Dependabot Alerts           | Critical, High, Medium and Low CVE Alerts                                                                                        | number  |

To use these providers, install the corresponding backend modules:

- GitHub: [`@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-github`](../scorecard-backend-module-github/README.md)
- Jira: [`@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-jira`](../scorecard-backend-module-jira/README.md)
- OpenSSF: [`@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-openssf`](../scorecard-backend-module-openssf/README.md)
- Dependabot: [`@red-hat-developer-hub/backstage-plugin-scorecard-backend-module-dependabot`](../scorecard-backend-module-dependabot/README.md)

### Disabling Metrics

Administrators can disable metric checks globally via app-config, and users can disable them for concrete entity via `scorecard.io/disabled-metrics` annotation. For more details, see [disabled-metrics-logic.md](./docs/disabled-metrics-logic.md).

## Thresholds

Thresholds define conditions to assign metric values to specific visual categories (`success`, `warning`, `error` or any custom category). The Scorecard plugin provides multiple ways to configure thresholds:

- **Provider Defaults**: Metric providers define default thresholds
- **App Configuration**: Override defaults through `app-config.yaml`
- **Entity Annotations**: Override specific thresholds per entity using catalog annotations

Thresholds are evaluated in order, and the first matching rule determines the category. The plugin supports various operators for number metrics (`>`, `>=`, `<`, `<=`, `==`, `!=`, `-` (range)) and boolean metrics (`==`, `!=`).

For comprehensive threshold configuration guide, examples, and best practices, see [thresholds.md](./docs/thresholds.md).

## Aggregation KPIs (homepage and `GET /aggregations`)

Aggregated scorecard data for the authenticated user’s owned entities is exposed under **`GET /aggregations/:aggregationId`**. Optional entries in **`scorecard.aggregationKPIs`** assign a stable **aggregation id** (KPI key), custom **title** and **description**, **type**, and the backing **metricId**.

```yaml
scorecard:
  aggregationKPIs:
    openIssuesKpi:
      title: 'Jira open issues KPI'
      description: 'Open issues across entities you own, grouped by status.'
      type: statusGrouped
      metricId: jira.open_issues
    openPrsKpi:
      title: 'GitHub open PRs KPI'
      description: 'Open pull requests grouped by status.'
      type: statusGrouped
      metricId: github.open_prs
```

| Field         | Description                                                    |
| ------------- | -------------------------------------------------------------- |
| `title`       | Display title for this aggregation (returned in API metadata). |
| `description` | Display description for this aggregation.                      |
| `type`        | Aggregation algorithm; currently `statusGrouped`.              |
| `metricId`    | Metric provider id used to load thresholds and compute counts. |

- **Path**: `scorecard.aggregationKPIs.<aggregationId>`.
- If **`aggregationKPIs` is omitted** or a given id is not listed, **`GET /aggregations/:aggregationId`** still works when **`aggregationId` equals the metric id** (e.g. `github.open_prs`): the backend uses that metric with the default `statusGrouped` aggregation and metric-defined title/description.
- Invalid KPI entries may be logged and skipped at runtime; prefer fixing config per backend validation.

**Homepage cards** are configured in the app (for example Dynamic Home Page mount points). They should pass **`aggregationId`** matching a key in `aggregationKPIs` or the metric id for the default case. See the [Scorecard frontend plugin README](../scorecard/README.md#homepage-scorecard-cards).

## API Endpoints

### `GET /metrics`

Returns a list of available metrics. Supports filtering by metric IDs or datasource.

#### Query Parameters

| Parameter    | Type   | Required | Description                                                                                |
| ------------ | ------ | -------- | ------------------------------------------------------------------------------------------ |
| `metricIds`  | string | No       | Comma-separated list of metric IDs to filter by (e.g., `github.open_prs,jira.open_issues`) |
| `datasource` | string | No       | Filter metrics by datasource ID (e.g., `github`, `jira`, `sonar`)                          |

#### Behavior

- If `metricIds` is provided, returns only the specified metrics
- If `datasource` is provided (and `metricIds` is not), returns all metrics from that datasource
- If neither parameter is provided, returns all available metrics
- **Note**: Providing both `metricIds` and `datasource` will result in a `400 Bad Request` error

#### Example Requests

```bash
# Get all metrics
curl -X GET "{{url}}/api/scorecard/metrics" \
  -H "Authorization: Bearer <token>"

# Get specific metrics by IDs
curl -X GET "{{url}}/api/scorecard/metrics?metricIds=github.open_prs,jira.open_issues" \
  -H "Authorization: Bearer <token>"

# Get all metrics from a specific datasource
curl -X GET "{{url}}/api/scorecard/metrics?datasource=github" \
  -H "Authorization: Bearer <token>"
```

### `GET /metrics/catalog/:kind/:namespace/:name`

Returns the latest metric values for a specific catalog entity.

#### Path Parameters

| Parameter   | Type   | Required | Description                        |
| ----------- | ------ | -------- | ---------------------------------- |
| `kind`      | string | Yes      | Entity kind (e.g., `component`)    |
| `namespace` | string | Yes      | Entity namespace (e.g., `default`) |
| `name`      | string | Yes      | Entity name                        |

#### Query Parameters

| Parameter   | Type   | Required | Description                                                                                |
| ----------- | ------ | -------- | ------------------------------------------------------------------------------------------ |
| `metricIds` | string | No       | Comma-separated list of metric IDs to filter by (e.g., `github.open_prs,jira.open_issues`) |

#### Permissions

Requires `scorecard.metric.read` permission and `catalog.entity.read` permission for the specific entity.

#### Example Request

```bash
curl -X GET "{{url}}/api/scorecard/metrics/catalog/component/default/my-service?metricIds=github.open_prs" \
  -H "Authorization: Bearer <token>"
```

### `GET /aggregations/:aggregationId`

Returns aggregated metrics for the authenticated user across all catalog entities they own (same ownership rules as the legacy route; see [aggregation.md](./docs/aggregation.md)).

The **`aggregationId`** is either:

- A key under **`scorecard.aggregationKPIs`** in app-config (KPI-specific title, description, type, and `metricId`), or
- The **metric id** itself when no KPI entry exists (default **statusGrouped** behavior).

#### Path Parameters

| Parameter       | Type   | Required | Description                                                                           |
| --------------- | ------ | -------- | ------------------------------------------------------------------------------------- |
| `aggregationId` | string | Yes      | KPI id from `scorecard.aggregationKPIs` or the metric id for the default aggregation. |

#### Authentication / permissions

Same as the deprecated aggregation route: user authentication, `scorecard.metric.read`, and `catalog.entity.read` for each aggregated entity.

#### Example Request

```bash
curl -X GET "{{url}}/api/scorecard/aggregations/openIssuesKpi" \
  -H "Authorization: Bearer <token>"

# Default aggregation when no KPI is configured (id equals metric id)
curl -X GET "{{url}}/api/scorecard/aggregations/github.open_prs" \
  -H "Authorization: Bearer <token>"
```

### `GET /aggregations/:aggregationId/metadata`

Returns **title**, **description**, **type**, **history**, and **aggregationType** for the aggregation without computing full aggregate counts. Uses the same resolution rules as `GET /aggregations/:aggregationId` (KPI config vs metric id fallback).

```bash
curl -X GET "{{url}}/api/scorecard/aggregations/openIssuesKpi/metadata" \
  -H "Authorization: Bearer <token>"
```

### `GET /metrics/:metricId/catalog/aggregations` (deprecated; removal planned)

This endpoint **remains available** for backward compatibility and behaves like the default case of **`GET /aggregations/:metricId`** (status-grouped aggregation for that metric). **It will be removed in a future major release** of the plugin - migrate to **`GET /aggregations/:aggregationId`**.

Responses include **RFC 8594** deprecation signals: header **`Deprecation: true`** and **`Link: <…/aggregations/<metricId>>; rel="alternate"`** pointing at the successor URL. The backend also logs a warning when this route is used.

Returns aggregated metrics for a specific metric across all entities owned by the authenticated user:

- Entities directly owned by the user
- Entities owned by groups the user is a direct member of (only direct parent groups are considered)

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
# Deprecated — prefer GET /aggregations/github.open_prs (or your KPI id)
curl -X GET "{{url}}/api/scorecard/metrics/github.open_prs/catalog/aggregations" \
  -H "Authorization: Bearer <token>"
```

For comprehensive documentation on how entity aggregation works, including details on transitive parent groups, error handling, and best practices, see [aggregation.md](./docs/aggregation.md).

## Configuration cleanup Job

The plugin has a predefined job that runs every day to check and clean old metrics. By default, metrics are saved for **365 days**, however, this period can be changed in the `app-config.yaml` file. Here is an example of how to do that:

```YAML app-config.yaml
---
scorecard:
  dataRetentionDays: 12
```

## Development

This plugin backend can be started in a standalone mode from directly in this
package with `yarn start`. It is a limited setup that is most convenient when
developing the plugin backend itself.

If you want to run the entire project, including the frontend, run `yarn start` from the root directory.
