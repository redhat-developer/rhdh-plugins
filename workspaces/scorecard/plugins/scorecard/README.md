# Scorecard Plugin for Backstage

The Scorecard plugin provides a configurable framework to visualize Key Performance Indicators (KPIs) in Backstage. This frontend plugin integrates with the Scorecard backend to deliver Scorecards.

The plugin supports both the **legacy** Backstage frontend and the **New Frontend System (NFS)**. Use the main package for legacy apps and the `/alpha` export for NFS apps. For NFS, the plugin currently provides three modules: a catalog module for the Scorecard entity tab, a home module for homepage widgets, and a translations module.
**Features:**

- **Entity scorecard tab** — View scorecard metrics on catalog entity pages (components, websites, etc.).
- **Scorecard homepage card** — Show aggregated KPIs on the home page (e.g. GitHub open PRs, Jira open issues). Supports **`statusGrouped`** (multi-slice pie) and **`average`** (weighted health donut) KPI types configured under **`scorecard.aggregationKPIs`**.
- **Scorecard Entities page** — Drill down from an aggregated metric to see the list of entities contributing to that metric, with entity-level values and status, so you can identify services impacting the KPI and investigate issues.

## Getting started

Your plugin has been added to the example app in this repository, meaning you'll be able to access it by running `yarn start` in the root directory, and then navigating to [/scorecard](http://localhost:3000/scorecard).

You can also serve the plugin in isolation by running `yarn start` in the plugin directory.
This method of serving the plugin provides quicker iteration speed and a faster startup and hot reloads.
It is only meant for local development, and the setup for it can be found inside the [/dev](./dev) directory.

## For Administrators

### Prerequisites

Before installing the frontend plugin, ensure that the Scorecard backend is integrated into your Backstage instance. Follow the [Scorecard backend plugin README](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/scorecard/plugins/scorecard-backend/README.md) for setup instructions.

### Installation and usage

Install the package in your frontend (use `app` for NFS or `app-legacy` for legacy):

```sh
yarn workspace app add @red-hat-developer-hub/backstage-plugin-scorecard
# or for the legacy frontend:
yarn workspace app-legacy add @red-hat-developer-hub/backstage-plugin-scorecard
```

### Procedure

#### NFS (New Frontend System) — app

1. Install the Scorecard frontend plugin (see [Installation and usage](#installation-and-usage)) using `app`:

   ```console
   yarn workspace app add @red-hat-developer-hub/backstage-plugin-scorecard
   ```

2. Register the plugin in `packages/app/src/App.tsx` using the **alpha** export:

   ```tsx
   // In packages/app/src/App.tsx
   import { createApp } from '@backstage/frontend-defaults';
   import {
     scorecardHomeModule,
     scorecardTranslationsModule,
     scorecardCatalogModule,
   } from '@red-hat-developer-hub/backstage-plugin-scorecard/alpha';

   const app = createApp({
     features: [
       scorecardHomeModule,
       scorecardCatalogModule,
       scorecardTranslationsModule,
       // ... other plugins
     ],
   });

   export default app.createRoot();
   ```

3. (Optional) Configure which entities show the Scorecard tab in `app-config.yaml` under `app.extensions`. If you do not add this extension config, the tab is shown for all entity kinds. To restrict by kind and optionally by type:

   ```yaml
   app:
     extensions:
       - entity-content:catalog/entity-content-scorecard:
           config:
             allowedFilters:
               - kind: component
               - kind: template
               - kind: resource
               - kind: location
   ```

   Each filter can include optional `kind` and/or `type`. An entity shows the tab if it matches at least one filter. You can restrict by **kind only**, by **type only**, or by **kind and type**:

   **By kind only:**

```yaml
allowedFilters:
  - kind: component
  - kind: template
```

**By type only** (e.g. any entity with `spec.type` equal to `service` or `website`):

```yaml
allowedFilters:
  - type: service
  - type: website
```

**By kind and type** (e.g. only `component` with type `website` or type `service`):

```yaml
allowedFilters:
  - kind: component
    type: website
  - kind: component
    type: service
```

To align with the legacy EntityPage (Scorecard on component pages and default entity page, not on api/group/user/system/domain), use the first example (by kind only).

4. Ensure the frontend can reach the Scorecard backend by configuring discovery in `app-config.yaml`:

   ```yaml
   discovery:
     endpoints:
       - target: http://localhost:7007/api/{{ pluginId }}
         plugins:
           - scorecard
   ```

5. Start the NFS app (e.g. `yarn start`), go to **Catalog**, open an entity. The **Scorecard** tab appears for entities that match your `allowedFilters` (or all entities if the extension config is omitted or empty).

6. (Optional) Enable homepage Scorecard widgets by adding `scorecardHomeModule` to app features (see step 2) and configuring home page extensions in `app-config.yaml`:

   ```yaml
   app:
     extensions:
       - page:home:
           config:
             path: /
       - api:home/visits: true
       - app-root-element:home/visit-listener: true
       - home-page-layout:home/dynamic-homepage-layout:
           config:
             customizable: true
             widgetLayout:
               AggregatedCardWithDeprecatedMetricId:
                 priority: 410
                 breakpoints:
                   xl: { w: 4, h: 6 }
                   lg: { w: 4, h: 6 }
                   md: { w: 4, h: 6 }
                   sm: { w: 4, h: 6 }
                   xs: { w: 4, h: 6 }
                   xxs: { w: 4, h: 6 }
               AggregatedCardWithDefaultAggregation:
                 priority: 420
                 breakpoints:
                   xl: { w: 4, h: 6, x: 4 }
                   lg: { w: 4, h: 6, x: 4 }
                   md: { w: 4, h: 6, x: 4 }
                   sm: { w: 4, h: 6, x: 4 }
                   xs: { w: 4, h: 6, x: 4 }
                   xxs: { w: 4, h: 6, x: 4 }
               AggregatedCardWithJiraOpenIssues:
                 priority: 430
                 breakpoints:
                   xl: { w: 4, h: 6 }
                   lg: { w: 4, h: 6 }
                   md: { w: 4, h: 6 }
                   sm: { w: 4, h: 6 }
                   xs: { w: 4, h: 6 }
                   xxs: { w: 4, h: 6 }
               AggregatedCardWithGithubOpenPrs:
                 priority: 440
                 breakpoints:
                   xl: { w: 4, h: 6, x: 4 }
                   lg: { w: 4, h: 6, x: 4 }
                   md: { w: 4, h: 6, x: 4 }
                   sm: { w: 4, h: 6, x: 4 }
                   xs: { w: 4, h: 6, x: 4 }
                   xxs: { w: 4, h: 6, x: 4 }
               AggregatedCardWithGithubFilecheckLicense:
                 priority: 450
                 breakpoints:
                   xl: { w: 4, h: 6 }
                   lg: { w: 4, h: 6 }
                   md: { w: 4, h: 6 }
                   sm: { w: 4, h: 6 }
                   xs: { w: 4, h: 6 }
                   xxs: { w: 4, h: 6 }
               AggregatedCardWithGithubFilecheckCodeowners:
                 priority: 460
                 breakpoints:
                   xl: { w: 4, h: 6, x: 8 }
                   lg: { w: 4, h: 6, x: 8 }
                   md: { w: 4, h: 6, x: 8 }
                   sm: { w: 4, h: 6, x: 8 }
                   xs: { w: 4, h: 6, x: 8 }
                   xxs: { w: 4, h: 6, x: 8 }
               AggregatedCardWithGithubOpenPrsWeighted:
                 priority: 470
                 breakpoints:
                   xl: { w: 4, h: 6, x: 8 }
                   lg: { w: 4, h: 6, x: 8 }
                   md: { w: 4, h: 6, x: 8 }
                   sm: { w: 4, h: 6, x: 8 }
                   xs: { w: 4, h: 6, x: 8 }
                   xxs: { w: 4, h: 6, x: 8 }
   ```

   The home module contributes seven widgets:

   - `AggregatedCardWithDeprecatedMetricId` (title: **Scorecard: With deprecated metricId property (Jira)**)
   - `AggregatedCardWithDefaultAggregation` (title: **Scorecard: With default aggregation config (GitHub)**)
   - `AggregatedCardWithJiraOpenIssues` (title: **Scorecard: Jira open blocking tickets**)
   - `AggregatedCardWithGithubOpenPrs` (title: **Scorecard: GitHub open PRs**)
   - `AggregatedCardWithGithubFilecheckLicense` (title: **Scorecard: LICENSE file exists**)
   - `AggregatedCardWithGithubFilecheckCodeowners` (title: **Scorecard: CODEOWNERS file exists**)
   - `AggregatedCardWithGithubOpenPrsWeighted` (title: **Scorecard: GitHub open PRs (weighted health)**)

   These widgets render the `ScorecardHomepageCard` component used in legacy apps, preconfigured with different aggregation/metric configurations.

##### Modules and extensions (NFS)

The following modules and extensions are available from `@red-hat-developer-hub/backstage-plugin-scorecard/alpha` for NFS apps:

**Modules**

| Module                        | Description                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scorecardHomeModule`         | Registers Scorecard homepage widgets for the home plugin (`AggregatedCardWithDeprecatedMetricId`, `AggregatedCardWithDefaultAggregation`, `AggregatedCardWithJiraOpenIssues`, `AggregatedCardWithGithubOpenPrs`, `AggregatedCardWithGithubFilecheckLicense`, `AggregatedCardWithGithubFilecheckCodeowners` and `AggregatedCardWithGithubOpenPrsWeighted`). |
| `scorecardCatalogModule`      | Registers the Scorecard entity tab with the catalog plugin. Add to your app's `features`. Which entities show the tab is configured via `app.extensions` (see step 3).                                                                                                                                                                                     |
| `scorecardTranslationsModule` | Registers Scorecard translations with the app. Add to your app's `features`.                                                                                                                                                                                                                                                                               |

**Extensions**

- `api:scorecard` — Scorecard API (provided by the plugin; auto-discovered when the plugin is installed).
- `entity-content:catalog/entity-content-scorecard` — Scorecard tab on catalog entity pages. Configure with `allowedFilters` in `app.extensions` to limit by kind and optionally type.
- `home-page-widget:home/scorecard-deprecated-metric-id` — Homepage widget using deprecated metricId property (Jira open issues).
- `home-page-widget:home/scorecard-default-aggregation` — Homepage widget using default aggregation config (GitHub open PRs).
- `home-page-widget:home/scorecard-jira-open-issues` — Homepage widget showing Jira open blocking tickets.
- `home-page-widget:home/scorecard-github-open-prs` — Homepage widget showing GitHub open PRs.
- `home-page-widget:home/scorecard-github-filecheck-license` - Homepage widget showing file check "License".
- `home-page-widget:home/scorecard-github-filecheck-codeowners` - Homepage widget showing file check "Codeowners".
- `home-page-widget:home/scorecard-github-open-prs-weighted` - Homepage widget showing average GitHub open PRs.

#### Legacy app

1. Install the Scorecard frontend plugin (see [Installation and usage](#installation-and-usage)) using `app-legacy`:

   ```console
   yarn workspace app-legacy add @red-hat-developer-hub/backstage-plugin-scorecard
   ```

2. Add the Scorecard tab to the entity overview in `packages/app-legacy/src/components/catalog/EntityPage.tsx` (or your legacy app's equivalent):

   ```tsx
   import { EntityScorecardContent } from '@red-hat-developer-hub/backstage-plugin-scorecard';

   const scorecardRoute = (
     <EntityLayout.Route path="/scorecard" title="Scorecard">
       <EntityScorecardContent />
     </EntityLayout.Route>
   );

   const serviceEntityPage = (
     <EntityLayout>
       ...
       {scorecardRoute}
     </EntityLayout>
   );

   const websiteEntityPage = (
     <EntityLayout>
       ...
       {scorecardRoute}
     </EntityLayout>
   );

   const componentPage = (
     <EntitySwitch>
       <EntitySwitch.Case if={isComponentType('service')}>
         {serviceEntityPage}
       </EntitySwitch.Case>
       <EntitySwitch.Case if={isComponentType('website')}>
         {websiteEntityPage}
       </EntitySwitch.Case>
     </EntitySwitch>
   );

   export const entityPage = (
     <EntitySwitch>
       ...
       <EntitySwitch.Case if={isKind('component')} children={componentPage} />
       ...
     </EntitySwitch>
   );
   ```

3. (Optional) Add Scorecard homepage cards to your home page:

   ```tsx
   import { ScorecardHomepageCard } from '@red-hat-developer-hub/backstage-plugin-scorecard';

   // GitHub open PRs
   <ScorecardHomepageCard metricId="github.open_prs" />

   // Jira open issues
   <ScorecardHomepageCard metricId="jira.open_issues" />
   ```

4. Ensure the frontend can reach the Scorecard backend by configuring discovery in `app-config.yaml` (see discovery snippet under [NFS](#nfs-new-frontend-system--app)).

5. Start the legacy app (e.g. `yarn start:legacy`) and open the **Scorecard** tab on catalog entity pages.

### Permission Framework Support

The Scorecard plugin has support for the permission framework.

- When [RBAC permission](https://github.com/backstage/community-plugins/tree/main/workspaces/rbac/plugins/rbac-backend#installation) framework is enabled, for non-admin users to access scorecard UI, the role associated with your user should have the following permission policies associated with it. Add the following in your permission policies configuration file named `rbac-policy.csv`:

```CSV
p, role:default/team_a, scorecard.metric.read, read, allow

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

**Note:** The backend also checks `catalog.entity.read` for each entity. Make sure your users/roles can read the catalog entities they want to view scorecards for.

### Accessing the Plugin

- **app (NFS):** Open your Backstage app, go to **Catalog**, open an entity. The **Scorecard** tab appears when the entity matches your `allowedFilters` in app-config (or for all entities if the extension config is omitted).
- **app-legacy:** Open your Backstage app, go to the entity overview from the catalog, and open the **Scorecard** tab to view and analyze scorecard metrics.

### Homepage scorecard cards

The plugin exports **`ScorecardHomepageCard`** (see [`plugin.ts`](./src/plugin.ts)) for use on customizable home pages (for example **Dynamic Home Page** mount points such as `home.page/cards`).

#### Backend configuration

Define KPI ids and optional labels under **`scorecard.aggregationKPIs`** so each card can call **`GET /aggregations/<aggregationId>`** with a stable id. See [Scorecard backend README — Aggregation KPIs](../scorecard-backend/README.md#aggregation-kpis-homepage-and-get-aggregations). If you omit a KPI entry, use the **metric id** as `aggregationId` (default status-grouped aggregation).

**`type: average`** KPIs require **`options.statusScores`** (weights per threshold rule key). Optionally set **`options.thresholds`** so the API returns **`aggregationChartDisplayColor`** for the headline percentage. Behavior, validation, and drill-down notes are described in [aggregation.md](../scorecard-backend/docs/aggregation.md).

#### Card props

The supported model is **a single `aggregationId` string** whose value is either:

- a **KPI key** from **`scorecard.aggregationKPIs`** in app-config (custom title, description, type, backing metric), or
- a **metric id** when you have no KPI row for that card (default **statusGrouped** aggregation and metric-defined metadata).

| Prop                | Status       | Description                                                                                                                          |
| ------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **`aggregationId`** | **Use this** | KPI id from **`scorecard.aggregationKPIs`** _or_ **metric id** for the default case. Sent to **`GET /aggregations/:aggregationId`**. |
| **`metricId`**      | **Legacy**   | Default aggregated card metadata: resolved as **`aggregationId ?? metricId`**.                                                       |

**Migrating**

- **Homepage `props`:** set **`aggregationId`** to your KPI key or metric id - drop **`metricId`** when your plugin version no longer requires it.
- **Custom HTTP clients:** replace **`GET .../metrics/<metricId>/catalog/aggregations`** with **`GET .../aggregations/<aggregationId>`** (same segment value when you used the metric id before). Deprecation **`Link`** headers point at the successor URL.
- **User-editable home cards:** if your **`settings.schema`** still exposes **`metricId`**, plan to rename or replace it with **`aggregationId`** using the same KPI vs metric-id rules once the frontend supports it.

Example (Dynamic Home Page–style mount point): register **`ScorecardHomepageCard`** and pass **`props.aggregationId`** (and **`metricId`** only if you still run an older card API):

```tsx
import { ScorecardHomepageCard } from '@red-hat-developer-hub/backstage-plugin-scorecard';
import { ComponentType } from 'react';

// Inside your home page cards config:
{
  Component: ScorecardHomepageCard as ComponentType,
  config: {
    id: 'scorecard-jira-open-issues',
    title: 'Scorecard: Jira open issues',
    layouts: { /* … */ },
    props: {
      aggregationId: 'openIssuesKpi',
      // metricId: 'jira.open_issues', // legacy only; remove when only aggregationId is supported
    },
  },
},
```

#### Default labels and translations

- The API returns **title** and **description** in **`metadata`** (from **`aggregationKPIs`** or from the metric definition).
- The homepage card applies **plugin translations** when keys exist for **`metric.<id>.title`** and **`metric.<id>.description`**, where **`<id>`** is the value passed into the translation hook (**`aggregationId ?? metricId`**). If no translation key matches, the UI shows the **metadata** strings from the API.
- **Custom `title` / `description` in `aggregationKPIs`** are returned as-is from the backend; add matching translation keys for **`metric.<yourKpiId>.*`** if you want those strings localized.

## Adding Translations

The Scorecard plugin supports internationalization (i18n) for metric titles and descriptions. To add translations for new metrics:

### 1. Add Translations to Translation Files

Add your translations to the appropriate language files in `src/translations/`:

**English (ref.ts):**

```typescript
export const scorecardMessages = {
  // ... existing translations
  metric: {
    'your-metric-id': {
      title: 'Your Translated Title',
      description: 'Your translated description',
    },
  },
};
```

**Other languages (de.ts, es.ts, fr.ts):**

```typescript
const scorecardTranslationDe = createTranslationMessages({
  ref: scorecardTranslationRef,
  messages: {
    // ... existing translations
    'metric.your-metric-id.title': 'Ihr übersetzter Titel', // German
    'metric.your-metric-id.description': 'Ihre übersetzte Beschreibung',
  },
});
```

### 2. Translation Key Format

Translation keys follow this pattern:

- **Metric titles**: `metric.{metric-id}.title`
- **Metric descriptions**: `metric.{metric-id}.description`

Use the same pattern with a **KPI id** as `{metric-id}` when localizing **`aggregationKPIs`** titles (for example **`metric.openIssuesKpi.title`**).

### 3. Fallback Behavior

If a translation key is not found, the plugin will automatically fall back to:

- The original `title` and `description` values from the metric definition
- For thresholds: capitalized versions of the threshold keys

### Example: Adding GitHub Open PRs Translation

```typescript
// In ref.ts
metric: {
  'github.open_prs': {
    title: 'GitHub open PRs',
    description: 'Current count of open Pull Requests for a given GitHub repository',
  },
}
```
