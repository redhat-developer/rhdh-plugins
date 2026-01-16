# Analytics Module: Adoption Insights

This plugin provides an opinionated implementation of the Backstage Analytics API for tracking adoption insights within your Backstage instance. It utilizes the `AdoptionInsightsAnalyticsApi` interface to collect and batch analytics events related to adoption metrics and sends them to the custom adoption insights backend.

This plugin contains no other functionality.

## Installation

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
import { AdoptionInsightsAnalyticsApi } from '@red-hat-developer-hub/backstage-plugin-analytics-module-adoption-insights';

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
import { AdoptionInsightsAnalyticsApiFactory } from '@red-hat-developer-hub/backstage-plugin-analytics-module-adoption-insights';

export const apis: AnyApiFactory[] = [AdoptionInsightsAnalyticsApiFactory];
```

## Configuration

The following optional configuration parameters are available to fine tune adoption analytics events:

```yaml
# app-config.yaml
app:
  analytics:
    adoptionInsights:
      maxBufferSize: 20 # Optional: Maximum buffer size for event batching (default: 20)
      flushInterval: 5000 # Optional: Flush interval in milliseconds for event batching (default: 5000ms)
      debug: false # Optional: Enable debug mode to log every event in the browser console (default: false)
```

### User IDs

This plugin supports sending user context by providing a `userID` and `userName`. This requires instantiating the `AdoptionInsightsAnalyticsApi` instance with an `identityApi` instance passed to it, but this is optional. If omitted the plugin will not send user context to Adoption Insights backend.

By default, it computes `userId` as SHA-256 hash of the current user's `userEntityRef`.

```tsx
// packages/app/src/apis.ts
import {
  analyticsApiRef,
  configApiRef,
  identityApiRef,
} from '@backstage/core-plugin-api';
import { AdoptionInsightsAnalyticsApi } from '@red-hat-developer-hub/backstage-plugin-analytics-module-adoption-insights';

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
