# adoption-insights

This plugin builds the backend for Adoption Insights Plugin. It helps store analytics events emitted by analytics API into the DB and provides an API layer for the frontend.

## Installation

This plugin is installed via the `@red-hat-developer-hub/backstage-plugin-adoption-insights-backend` package. To install it to your backend package, run the following command:

```bash
# From your root directory
yarn --cwd packages/backend add @red-hat-developer-hub/backstage-plugin-adoption-insights-backend
```

Then add the plugin to your backend in `packages/backend/src/index.ts`:

```ts
const backend = createBackend();
// ...
backend.add(
  import('@red-hat-developer-hub/backstage-plugin-adoption-insights-backend'),
);
```

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
```

#### Permission Framework Support

The Adoption Insights Backend plugin has support for the permission framework.

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
developing the plugin backend itself.

If you want to run the entire project, including the frontend, run `yarn start` from the root directory.

# Events API

## Endpoint

`GET /api/adoption-insights/events`

## Query Parameters

| Parameter    | Type                | Required | Description                                                                                                                                     |
| ------------ | ------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`       | string              | Yes      | Filter events by type (e.g., `total_users`, `active_users`,`top_plugins`,`top_templates`,`top_techdocs`,`top_searches`,`top_catalog_entities`). |
| `start_date` | string (YYYY-MM-DD) | Yes      | Fetch events starting from this date.                                                                                                           |
| `end_date`   | string (YYYY-MM-DD) | Yes      | Fetch events up to this date.                                                                                                                   |
| `limit`      | integer             | No       | Limit the number of events returned (default: `3`).                                                                                             |
| `kind`       | string              | No       | Filter the entities by kind.                                                                                                                    |
| `grouping`   | string              | No       | Group API endpoint `(active_users,top_plugins and top_searches)` response by `hourly`, `daily`, `weekly`, and `monthly`.                        |
| `format`     | string              | No       | Response format, either `json` (default) or `csv`.                                                                                              |

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
