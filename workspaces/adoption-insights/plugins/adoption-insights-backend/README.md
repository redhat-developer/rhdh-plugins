# adoption-insights

This plugin builds the backend for Adoption Insights Plugin. It helps store analytics events emitted by analytics API into the DB and provides an API layer for the frontend.

## Installation

This plugin requires the Catalog backend service. If your backend does not already include the Catalog backend, install it alongside the Adoption Insights backend plugin:

```bash
# From your root directory
yarn --cwd packages/backend add @backstage/plugin-catalog-backend @red-hat-developer-hub/backstage-plugin-adoption-insights-backend
```

Then add the plugin to your backend in `packages/backend/src/index.ts`:

```ts
const backend = createBackend();
// ...
backend.add(import('@backstage/plugin-catalog-backend'));
backend.add(
  import('@red-hat-developer-hub/backstage-plugin-adoption-insights-backend'),
);
```

If the Catalog backend is already registered, keep its existing registration and add only the Adoption Insights backend plugin.

## Configuration

The following optional configuration parameters are available to fine tune adoption analytics events:

```yaml
app:
  analytics:
    adoptionInsights:
      maxBufferSize: 20 # Optional: Maximum buffer size for event batching (default: 20)
      flushInterval: 5000 # Optional: Flush interval in milliseconds for event batching (default: 5000ms)
      debug: false # Optional: Enable debug mode to log every event in the browser console (default: false)
      licensedUsers: 100 # Administrators can set this value to see the user adoption metrics.
      maxEventsPerRequest: 100 # Optional: Positive integer maximum number of events accepted in a single POST /events request (default: 100)
```

#### Permission Framework Support

The Adoption Insights Backend plugin has support for the permission framework. The frontend NFS page uses an `if` predicate on `adoption-insights.events.read` so unauthorized users do not see the page or navigation entry.

- When [RBAC permission](https://github.com/backstage/community-plugins/tree/main/workspaces/rbac/plugins/rbac-backend#installation) framework is enabled, for non-admin users to access Adoption Insights backend API, the role associated with your user should have the following permission policies associated with it. Add the following in your permission policies configuration file named `rbac-policy.csv`:

  ```CSV
  p, role:default/team_a, adoption-insights.events.read, read, allow

  g, user:default/<your-user-name>, role:default/team_a

  ```

  You can specify the path to this configuration file in your application configuration:

  ```yaml
  permission:
    enabled: true
    rbac:
      policies-csv-file: /some/path/rbac-policy.csv
      policyFileReload: true
  ```

- When using the [permission policy](https://backstage.io/docs/permissions/writing-a-policy/) framework. To test the permission policy, we have created a AdoptionInsightsTestPermissionPolicy and a permissionsPolicyExtension.

  1. add the policy extension module in the `workspaces/adoption-insights/packages/backend/src/index.ts` and comment the Allow all Permission policy module as shown below.

     ```diff
     backend.add(import('@backstage/plugin-permission-backend'));
     // See https://backstage.io/docs/permissions/getting-started for how to create your own permission policy
     -backend.add(
     -  import('@backstage/plugin-permission-backend-module-allow-all-policy'),
     -);

     +backend.add(import('./extensions/PermissionPolicyExtension'));

     // search plugin
     backend.add(import('@backstage/plugin-search-backend'));
     ```

  2. Make a simple change to our [AdoptionInsightsTestPermissionPolicy](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/adoption-insights/packages/backend/src/extensions/PermissionPolicyExtension.ts) to confirm that policy is indeed wired up correctly. With the below change all the event API requests will fail with `Unauthorized` error.

     ```diff
     class AdoptionInsightsTestPermissionPolicy implements PermissionPolicy {
           isPermission(request.permission, adoptionInsightsEventsReadPermission)
         ) {
           return {
     -        result: AuthorizeResult.ALLOW,
     +        result: AuthorizeResult.DENY,
           };
         }
     ```

  3. start the application by running `yarn start` from `workspaces/adoption-insights` directory.

## Development

This plugin backend can be started in a standalone mode from directly in this
package with `yarn start`. It is a limited setup that is most convenient when
developing the plugin backend itself. This development setup provides a Catalog
service mock.

If you want to run the entire project, including the frontend, run `yarn start` from the root directory.

# Events API

## Endpoint

`GET /api/adoption-insights/events`

When `type=top_techdocs`, the backend may enrich each row with a TechDocs `site_name`. That lookup uses Backstage plugin-to-plugin authentication (`getPluginRequestToken`) on behalf of the calling user — it does not forward the caller's raw `Authorization` header. TechDocs therefore evaluates `catalog.entity.read` for that user; entities they cannot read fall back to the entity name, as do failed lookups and invalid entity paths. Rows with empty `namespace` / `kind` / `name` keep an empty `site_name` (TechDocs root).

## Ingesting events

`POST /api/adoption-insights/events`

The analytics module batches events on the client and sends them as a JSON array to this endpoint. The backend applies the following limits and validation before persisting a batch:

- **Batch size limit.** A single request may contain at most `maxEventsPerRequest` events (default `100`, configurable under `app.analytics.adoptionInsights.maxEventsPerRequest`). The configured limit must be a positive integer. Oversized batches are rejected with `400` before any catalog lookup or enqueue runs. The default analytics module flushes far smaller batches (see `maxBufferSize`), so this limit only affects callers that batch aggressively — raise it if you have a legitimate need.
- **All-or-nothing validation.** Every event in the batch is validated before any of them are enqueued. If any event fails validation the whole request is rejected with `400` and no events from that batch are stored. (Previously, valid events appearing before the first invalid one could be partially persisted.)
- **Deduplicated enrichment.** Scaffolder create events are enriched with the Template's `backstage.io/time-saved` estimate; each distinct template ref is resolved from the catalog only once per batch, with bounded concurrency, to avoid flooding the catalog on large batches.

## Query Parameters

| Parameter    | Type                | Required | Description                                                                                                                                                        |
| ------------ | ------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `type`       | string              | Yes      | Filter events by type (e.g., `total_users`, `active_users`, `top_plugins`, `top_templates`, `time_saved`, `top_techdocs`, `top_searches`, `top_catalog_entities`). |
| `start_date` | string (YYYY-MM-DD) | Yes      | Fetch events starting from this date.                                                                                                                              |
| `end_date`   | string (YYYY-MM-DD) | Yes      | Fetch events up to this date.                                                                                                                                      |
| `limit`      | integer             | No       | Limit the number of rows returned (default: `3`).                                                                                                                  |
| `sort_by`    | `clicks` or `runs`  | No       | Rank `top_templates` by clicks on the wizard's final Create button (default) or created task runs.                                                                 |
| `kind`       | string              | No       | Filter the entities by kind.                                                                                                                                       |
| `grouping`   | string              | No       | Group API endpoint `(active_users,top_plugins and top_searches)` response by `hourly`, `daily`, `weekly`, and `monthly`.                                           |
| `format`     | string              | No       | Response format, either `json` (default) or `csv`.                                                                                                                 |

### Top templates

`GET /api/adoption-insights/events?type=top_templates&start_date=2025-03-01&end_date=2025-03-31&timezone=UTC&limit=3` returns the templates with the most clicks on the wizard's final Create button, alongside their task runs and estimated minutes saved in the same date range:

```json
{
  "data": [
    {
      "entityref": "template:default/example",
      "count": 5,
      "last_used": "2025-03-20T10:00:00Z",
      "runs": 3,
      "minutes": 135.5
    }
  ]
}
```

Omitting `sort_by` or setting `sort_by=clicks` keeps the existing ranking: `limit` selects the templates with the most final Create button clicks. The click event is emitted before the task creation request, so a failed submission can increase `count` without increasing `runs`. Opening a template card emits a different event and does not increase `count`. The click filter matches the exact label `Create`; a customized button label is not included.

Set `sort_by=runs` to select the templates with the most Scaffolder tasks created in the date range. The `count` and `last_used` fields always describe matching final Create button clicks. A task creation event with no matching `Create` click can appear in the runs ranking with `count: 0` and `last_used: null`.

`runs` includes task creation events without an estimate. `minutes` sums the estimates stored on those events; a run without an estimate adds zero minutes. Templates with clicks but no task runs return zero for both new fields. Editing the template annotation later does not change minutes already stored for earlier runs.

For example, `GET /api/adoption-insights/events?type=top_templates&start_date=2025-03-01&end_date=2025-03-31&timezone=UTC&sort_by=runs&limit=3` returns the three most-run templates. Both sort modes also support `format=csv`.

### Estimated time saved

`GET /api/adoption-insights/events?type=time_saved&start_date=2025-03-01&end_date=2025-03-31&timezone=UTC` returns one total in the existing `data` array:

```json
{ "data": [{ "minutes": 480, "runs": 10, "runs_with_estimate": 7 }] }
```

The query requires `adoption-insights.events.read` and also supports `format=csv`. It counts `scaffolder` analytics events with action `create` and subject `Task has been created`, which are emitted when a task is created rather than when it completes. `runs` includes events with no estimate; those events add zero minutes and are excluded from `runs_with_estimate`.

For new Scaffolder create events, the backend reads the Template's `backstage.io/time-saved` annotation from the catalog as the signed-in user. The annotation is an ISO 8601 duration such as `PT8H` or `PT15M`. A missing or invalid annotation, or a failed catalog lookup, leaves the event's value empty. The submitted event value is not used for these events. The backend stores the signed-in user's entity ref as `user_ref` for every newly accepted analytics event. Historical Scaffolder create events stored minutes when an estimate was present, but those values came from the client rather than a catalog lookup. Historical rows are not changed when a template's annotation changes.

## Example Request

```http
GET /api/adoption-insights/events?type=top_plugins&start_date=2025-03-01&end_date=2025-03-02&limit=3
```

## Example Response

<details> <summary>Click to expand</summary>

```json
{
  "grouping": "daily",
  "data": [
    {
      "plugin_id": "catalog",
      "visit_count": "27",
      "trend": [
        {
          "date": "2025-03-01",
          "count": 10
        },
        {
          "date": "2025-03-02",
          "count": 17
        }
      ],
      "trend_percentage": "70.00"
    },
    {
      "plugin_id": "root",
      "visit_count": "15",
      "trend": [
        {
          "date": "2025-03-01",
          "count": 9
        },
        {
          "date": "2025-03-02",
          "count": 6
        }
      ],
      "trend_percentage": "-33.33"
    },
    {
      "plugin_id": "kubernetes",
      "visit_count": "9",
      "trend": [
        {
          "date": "2025-03-01",
          "count": 4
        },
        {
          "date": "2025-03-02",
          "count": 5
        }
      ],
      "trend_percentage": "25.00"
    }
  ]
}
```

</details>
