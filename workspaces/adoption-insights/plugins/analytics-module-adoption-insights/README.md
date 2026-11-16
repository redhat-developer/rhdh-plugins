# Analytics Module: Adoption Insights

This plugin provides an opinionated implementation of the Backstage Analytics API for tracking adoption insights within your Backstage instance. It utilizes the `AdoptionInsightsAnalyticsApi` interface to collect and batch analytics events related to adoption metrics and sends them to the custom adoption insights backend.

This plugin contains no other functionality.

NFS is the primary package entry point. OFS (legacy) exports (`AdoptionInsightsAnalyticsApi` and `AdoptionInsightsAnalyticsApiFactory`) are available only at `./legacy`.

## Installation

### NFS (New Frontend System)

Install the package and add the default plugin to your app features:

```sh
# From your Backstage root directory
yarn --cwd packages/app add @red-hat-developer-hub/backstage-plugin-analytics-module-adoption-insights
```

```tsx
import { createApp } from '@backstage/frontend-defaults';
import adoptionInsightsAnalyticsPlugin from '@red-hat-developer-hub/backstage-plugin-analytics-module-adoption-insights';

export default createApp({
  features: [
    adoptionInsightsAnalyticsPlugin,
    // ... other plugins
  ],
});
```

### OFS (legacy frontend)

1. **Install the plugin package in your Backstage app:**

```sh
# From your Backstage root directory
yarn --cwd packages/app add @red-hat-developer-hub/backstage-plugin-analytics-module-adoption-insights
```

2. **Wire up the API implementation to your App:**

```tsx
// packages/app/src/apis.ts
import {
  analyticsApiRef,
  configApiRef,
  identityApiRef,
} from '@backstage/core-plugin-api';
import { AdoptionInsightsAnalyticsApi } from '@red-hat-developer-hub/backstage-plugin-analytics-module-adoption-insights/legacy';

export const apis: AnyApiFactory[] = [
  createApiFactory({
    api: analyticsApiRef,
    deps: { configApi: configApiRef, identityApi: identityApiRef },
    factory: ({ configApi, identityApi }) =>
      AdoptionInsightsAnalyticsApi.fromConfig(configApi, {
        identityApi,
      }),
  }),
];
```

** Or use the factory from the package: **

```tsx
// packages/app/src/apis.ts
import { AdoptionInsightsAnalyticsApiFactory } from '@red-hat-developer-hub/backstage-plugin-analytics-module-adoption-insights/legacy';

export const apis: AnyApiFactory[] = [AdoptionInsightsAnalyticsApiFactory];
```

## Configuration

The following optional configuration parameters are available to fine tune adoption analytics events:

```yaml
# app-config.yaml
app:
  analytics:
    adoptionInsights:
      maxBufferSize: 20 # Optional: Maximum buffer size for event batching, and the maximum number of events sent per request (default: 20)
      flushInterval: 5000 # Optional: Flush interval in milliseconds for event batching (default: 5000ms)
      debug: false # Optional: Enable debug mode to log every event in the browser console (default: false)
```

`maxBufferSize` must be a positive integer. If it is not, the module logs a warning and uses the default of `20`. It must also not exceed the backend's `app.analytics.adoptionInsights.maxEventsPerRequest` (default `100`); otherwise every batch is rejected by the backend and dropped.

### Delivery and retries

Buffered events are sent to `POST /api/adoption-insights/events` in batches of at most `maxBufferSize` events. Only one flush runs at a time; events captured while a flush is in progress are sent by the next flush.

- **HTTP 4xx** (for example a validation error or an oversized batch): the batch is logged to the browser console and dropped. Retrying would fail the same way and block newer events.
- **Network error or HTTP 5xx**: the failed batch and any remaining events are logged and put back at the front of the queue, then retried on the next flush.
- The queue of unsent events is capped at 1000 events. When it is full, the oldest events are dropped and a message is logged. Events belonging to a request that is still in flight are not counted until they are requeued.

### User IDs

The analytics API requires `identityApi`. It uses the current user's identity to attach a SHA-256 hash of `userEntityRef` as `context.userId`, and it sends the user's credentials with each batch. The backend skips events without `context.userId`. For accepted events, the backend sets the stored `user_ref` from the authenticated user principal, rather than trusting a client-supplied `userName`. This applies to every accepted analytics event, including non-Scaffolder events.

```tsx
// packages/app/src/apis.ts
import {
  analyticsApiRef,
  configApiRef,
  identityApiRef,
} from '@backstage/core-plugin-api';
import { AdoptionInsightsAnalyticsApi } from '@red-hat-developer-hub/backstage-plugin-analytics-module-adoption-insights/legacy';

export const apis: AnyApiFactory[] = [
  createApiFactory({
    api: analyticsApiRef,
    deps: { configApi: configApiRef, identityApi: identityApiRef },
    factory: ({ configApi, identityApi }) =>
      AdoptionInsightsAnalyticsApi.fromConfig(configApi, {
        identityApi,
      }),
  }),
];
```

## Development

To contribute improvements to this plugin:

1. Clone the main Backstage monorepo:

```sh
git clone git@github.com:redhat-developer/rhdh-plugins.git
```

2. Install all dependencies:

```sh
yarn install
```

3. If one does not exist, create an `app-config.local.yaml` file in the root of the monorepo and add config for this plugin (see below).

4. Enter this plugin's working directory:

```sh
cd workspaces/adoption-insights/plugins/analytics-module-adoption-insights
```

5. Start the plugin in isolation:

```sh
yarn start
```

6. Navigate to `http://localhost:3000/adoption-insights` and open the web console to see events firing.

### Recommended Dev Config

```yaml
app:
  analytics:
    adoptionInsights:
      maxBufferSize: 25
      flushInterval: 6000
      debug: true
```

---

> **Note:** Ensure the configuration matches your adoption insights backend for proper data collection and analysis.
