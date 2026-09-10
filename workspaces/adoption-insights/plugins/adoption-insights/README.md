# Adoption Insights Plugin for Backstage

The Adoption Insights plugin provides an interactive dashboard to visualize analytics data in Backstage. This frontend plugin integrates with the Adoption Insights backend to deliver insights into adoption trends and usage statistics.

The plugin supports both the **legacy** Backstage frontend and the **New Frontend System (NFS)**. NFS is the primary package entry point. OFS (legacy) exports are available only at `./legacy`. Translations remain available at `./alpha`.

## Getting started

Your plugin has been added to the example app in this repository, meaning you'll be able to access it by running `yarn start` in the root directory, and then navigating to [/adoption-insights](http://localhost:3000/adoption-insights).

You can also serve the plugin in isolation from the plugin directory:

- `yarn start` — New Frontend System (NFS)
- `yarn start:legacy` — legacy frontend (OFS)

## For Administrators

### Prerequisites

Before installing the frontend plugin, ensure that the Adoption Insights backend is integrated into your Backstage instance. Follow the [Adoption Insights backend plugin README](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/adoption-insights/plugins/adoption-insights-backend/README.md) for setup instructions.

### Installation

Install the package in your frontend (use `app` for NFS or `app-legacy` for legacy):

```sh
yarn workspace app add @red-hat-developer-hub/backstage-plugin-adoption-insights
# or for the legacy frontend:
yarn workspace app-legacy add @red-hat-developer-hub/backstage-plugin-adoption-insights
```

**Note**

### Permission Framework Support

The Adoption Insights plugin has support for the permission framework.

- When [RBAC permission](https://github.com/backstage/community-plugins/tree/main/workspaces/rbac/plugins/rbac-backend#installation) framework is enabled, for non-admin users to access adoption insights UI, the role associated with your user should have the following permission policies associated with it. Add the following in your permission policies configuration file named `rbac-policy.csv`:

```CSV
p, role:default/team_a, adoption-insights.events.read, read, ALLOW

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

### Configuration

#### NFS (New Frontend System) — app

Register the default plugin plus `adoptionInsightsTranslationsModule` in `packages/app/src/App.tsx`:

```tsx
import { createApp } from '@backstage/frontend-defaults';
import adoptionInsightsPlugin, {
  adoptionInsightsTranslationsModule,
} from '@red-hat-developer-hub/backstage-plugin-adoption-insights';

const app = createApp({
  features: [
    adoptionInsightsPlugin,
    adoptionInsightsTranslationsModule,
    // ... other plugins
  ],
});

export default app.createRoot();
```

The translations module uses `pluginId: 'app'` and is also available as the default export of `@red-hat-developer-hub/backstage-plugin-adoption-insights/adoption-insights-translations-module`.

#### OFS (legacy frontend) — app-legacy

1. Add the **Adoption Insights** page to your Backstage application by modifying `packages/app/src/App.tsx`:

   ```tsx
   import { AdoptionInsightsPage } from '@red-hat-developer-hub/backstage-plugin-adoption-insights/legacy';
   import { adoptionInsightsTranslations } from '@red-hat-developer-hub/backstage-plugin-adoption-insights/alpha';

   <Route path="/adoption-insights" element={<AdoptionInsightsPage />} />;
   ```

2. Add a navigation item to the Backstage sidebar by updating `packages/app/src/components/Root/Root.tsx`:

   ```tsx
   import QueryStatsIcon from '@mui/icons-material/QueryStats';

   <SidebarItem
     icon={QueryStatsIcon}
     to="adoption-insights"
     text="Adoption Insights"
   />;
   ```

Dynamic plugin configurations must use `module: Legacy` for OFS exports. See `app-config.dynamic.yaml`.

## For Users

### Using the Adoption Insights Plugin

The Adoption Insights plugin allows users to explore analytics data through an interactive dashboard.

#### Prerequisites

- A running Backstage application.
- The Adoption Insights plugin is installed and configured. See [Installation](#installation) for setup instructions.

#### Accessing the Plugin

1. Open your Backstage application.
2. Navigate to the **Adoption Insights** section from the sidebar.
3. Explore and analyze adoption metrics using the interactive dashboard.
