# Scorecard Plugin for Backstage

The Scorecard plugin provides a configurable framework to visualize Key Performance Indicators (KPIs) in Backstage. This frontend plugin integrates with the Scorecard backend to deliver Scorecards.

The plugin supports both the **legacy** Backstage frontend and the **New Frontend System (NFS)**. Use the main package for legacy apps and the `/alpha` export for NFS apps. NFS supports only 1 module as of now (the catalog module that adds the Scorecard entity tab).

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
   import scorecardPlugin, {
     scorecardTranslationsModule,
     createScorecardCatalogModule,
   } from '@red-hat-developer-hub/backstage-plugin-scorecard/alpha';

   // Optional: limit which entity kinds show the Scorecard tab (default: all kinds)
   const scorecardCatalogModule = createScorecardCatalogModule({
     entityKinds: ['component', 'service', 'template'],
   });

   const app = createApp({
     features: [
       scorecardCatalogModule,
       scorecardTranslationsModule,
       scorecardPlugin,
       // ... other plugins
     ],
   });

   export default app.createRoot();
   ```

3. Ensure the frontend can reach the Scorecard backend by configuring discovery in `app-config.yaml`:

   ```yaml
   discovery:
     endpoints:
       - target: http://localhost:7007/api/{{ pluginId }}
         plugins:
           - scorecard
   ```

4. Start the NFS app (e.g. `yarn start`), go to **Catalog**, open an entity. The **Scorecard** tab appears for the kinds you configured (or all kinds if none were specified).

##### Modules and extensions (NFS)

The following modules and extensions are available from `@red-hat-developer-hub/backstage-plugin-scorecard/alpha` for NFS apps:

**Modules**

| Module                                   | Description                                                                                                                                                                 |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `createScorecardCatalogModule(options?)` | Registers the Scorecard entity tab with the catalog plugin. Add the returned module to your app's `features`. Optional `entityKinds` limit which entity kinds show the tab. |
| `scorecardTranslationsModule`            | Registers Scorecard translations with the app. Add to your app's `features`.                                                                                                |

**Extensions**

- `api:scorecard` — Scorecard API (provided by the plugin; auto-discovered when the plugin is installed).
- `entity-content:catalog/scorecard` — Scorecard tab on catalog entity pages (provided by the catalog module).

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

3. Optionally use `ScorecardHomepageCard` and `scorecardTranslations` from the main and alpha packages as needed.

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

- **app (NFS):** Open your Backstage app, go to **Catalog**, open an entity (e.g. a component or service). The **Scorecard** tab appears on the entity page for the kinds you configured (or all kinds if none were specified).
- **app-legacy:** Open your Backstage app, go to the entity overview from the catalog, and open the **Scorecard** tab to view and analyze scorecard metrics.

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
