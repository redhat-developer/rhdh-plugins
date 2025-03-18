# adoption-insights

This plugin builds the backend for Adoption Insights Plugin. It helps store analytics events emitted by analytics API into the DB and provides an API layer for the frontend.

## Installation

This plugin is installed via the `@@red-hat-developer-hub/backstage-plugin-adoption-insights-backend` package. To install it to your backend package, run the following command:

```bash
# From your root directory
yarn --cwd packages/backend add @@red-hat-developer-hub/backstage-plugin-adoption-insights-backend
```

Then add the plugin to your backend in `packages/backend/src/index.ts`:

```ts
const backend = createBackend();
// ...
backend.add(
  import('@@red-hat-developer-hub/backstage-plugin-adoption-insights-backend'),
);
```

## Configuration

```yaml
app:
  analytics:
    adoptionInsights:
      maxBufferSize: 25
      flushInterval: 6000
      debug: false # enable this to debug
      licensedUsers: 100 # Administrators can set this value to see the user adoption metrics.
```

## Development

This plugin backend can be started in a standalone mode from directly in this
package with `yarn start`. It is a limited setup that is most convenient when
developing the plugin backend itself.

If you want to run the entire project, including the frontend, run `yarn dev` from the root directory.

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
