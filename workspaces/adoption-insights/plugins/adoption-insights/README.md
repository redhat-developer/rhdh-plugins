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

Install the package in your frontend:

```sh
yarn workspace app add @red-hat-developer-hub/backstage-plugin-adoption-insights
```

**Note**

### Permission Framework Support

The Adoption Insights plugin has support for the permission framework.

When using the **new frontend system**, the Adoption Insights page is registered with an `if` predicate for `adoption-insights.events.read`. When permission checks deny access, the page and sidebar entry are not registered for that session.

> **Legacy (OFS) note:** The `./legacy` entry point still uses `usePermission` on the page and shows a permission-required empty state on direct navigation. The legacy sidebar item is not gated.

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

#### OFS (legacy frontend)

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

### Homepage widgets (NFS)

`adoptionInsightsPlugin` registers Popular Content homepage widgets that attach to RHDH `page:homepage`.

**Prerequisite:** install and enable `@red-hat-developer-hub/backstage-plugin-homepage` (and typically `@red-hat-developer-hub/backstage-plugin-homepage-backend`) so `page:homepage` and the Add Widget catalog are available. Usage-ranked modes (`auto` / `hybrid`) also require the Adoption Insights backend.

In an NFS app feature loader / `packages/app`, import both plugins, for example:

```ts
import homepagePlugin from '@red-hat-developer-hub/backstage-plugin-homepage';
import adoptionInsightsPlugin from '@red-hat-developer-hub/backstage-plugin-adoption-insights';

export const features = [homepagePlugin, adoptionInsightsPlugin /*, … */];
```

Widgets are gated by `adoption-insights.events.read`. Users without that permission do not see Adoption Insights homepage cards on the grid or in the Add Widget catalog.

#### Top Plugins

| Field        | Value                                                 |
| ------------ | ----------------------------------------------------- |
| Extension ID | `home-page-widget:adoption-insights/top-plugins-card` |
| Widget name  | `TopPluginsCard`                                      |
| Title        | **Top Plugins**                                       |

Shows org-wide most-used plugins/extensions from Adoption Insights.

**Modes**

| Mode             | Behavior                                       |
| ---------------- | ---------------------------------------------- |
| `auto` (default) | Usage-ranked from Adoption Insights            |
| `hybrid`         | Admin pins/overrides merged with usage ranking |
| `curated`        | Admin list only (no Adoption Insights fetch)   |

**Settings / layout props**

| Prop                 | Type                            | Default | Description                                                                  |
| -------------------- | ------------------------------- | ------- | ---------------------------------------------------------------------------- |
| `mode`               | `auto` \| `hybrid` \| `curated` | `auto`  | Content selection mode                                                       |
| `displayCount`       | number                          | `3`     | Number of rows to show                                                       |
| `title`              | string                          | —       | Optional card title override                                                 |
| `items`              | `{ id, title?, href?, … }[]`    | —       | Curated list (`curated`) or pins (`hybrid`); ignored in `auto`               |
| `pluginDestinations` | `{ [pluginId]: '/path' }`       | —       | Extra / overriding routes for ranked rows (and curated items without `href`) |

Rows link only when a destination is known. Built-in destinations cover common OOTB / supported plugins (Catalog, Catalog Graph, Bulk Import, RBAC, Tech Radar, …). Unknown `plugin_id` values stay plain text unless you add them via `pluginDestinations` (or set `items[].href` in curated/hybrid).

On an editable homepage, add **Top Plugins** from the widget catalog and edit mode / display count / title in card settings. Use `widgetLayout` props for a read-only homepage (or to seed defaults).

Example `app-config.yaml` (with the Homepage plugin). On RHDH / when
`homepage-backend` is installed, **also** list the widget under
`homepage.defaultWidgets` — the Add-widget catalog only includes refs that
match the extension name (`top-plugins-card`):

```yaml
app:
  extensions:
    - page:home: false
    - page:homepage:
        config:
          path: /
    - page:catalog:
        config:
          path: /catalog
    - home-page-layout:homepage/dynamic-homepage-layout:
        config:
          customizable: true
          widgetLayout:
            TopPluginsCard:
              priority: 400
              props:
                mode: auto
                displayCount: 5
                # Optional: register custom / third-party plugin routes
                pluginDestinations:
                  my-custom-plugin: /my-custom-plugin
                  # Override a built-in destination if your path differs
                  # scaffolder: /templates
              breakpoints:
                xl: { w: 4, h: 5 }
                lg: { w: 4, h: 5 }
                md: { w: 6, h: 5 }
                sm: { w: 6, h: 5 }
                xs: { w: 12, h: 5 }
                xxs: { w: 12, h: 5 }

homepage:
  defaultWidgets:
    - id: top-plugins-card
      ref: top-plugins-card
      props:
        title: Top Plugins
        mode: auto
        displayCount: 5
```

Read-only curated example (no Adoption Insights ranking call):

```yaml
widgetLayout:
  TopPluginsCard:
    props:
      mode: curated
      displayCount: 3
      title: Recommended plugins
      items:
        - id: catalog
          title: Catalog
          href: /catalog
        - id: scaffolder
          title: Software Templates
          href: /create
```

##### Modules and extensions (NFS)

| Module                               | Description                                                             |
| ------------------------------------ | ----------------------------------------------------------------------- |
| `adoptionInsightsTranslationsModule` | Registers Adoption Insights translations. Add to your app's `features`. |

| Extension ID                                          | Description                                                           |
| ----------------------------------------------------- | --------------------------------------------------------------------- |
| `api:adoption-insights`                               | Adoption Insights API (auto-discovered when the plugin is installed). |
| `page:adoption-insights`                              | Adoption Insights dashboard page.                                     |
| `home-page-widget:adoption-insights/top-plugins-card` | Homepage **Top Plugins** widget (`TopPluginsCard`).                   |

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

#### Homepage Top Plugins card

On the RHDH homepage, the **Top Plugins** card (BUI `Card` / `List` / `ListRow`) lists popular plugins and extensions for your organization (rank, display name, plugin id, trend %, and visit count on a second line). Click a row to open that plugin when a destination is available. Empty and error states keep the card on the page so the homepage remains loadable. Users without `adoption-insights.events.read` do not see the card at all.
