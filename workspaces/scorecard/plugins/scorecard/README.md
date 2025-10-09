# 📊 Scorecard Plugin for Backstage

The Scorecard plugin provides a configurable framework to visualize Key Performance Indicators (KPIs) in Backstage. This frontend plugin integrates with the Scorecard backend to deliver Scorecards.

## Getting started

Your plugin has been added to the example app in this repository, meaning you'll be able to access it by running `yarn start` in the root directory, and then navigating to [/scorecard](http://localhost:3000/scorecard).

You can also serve the plugin in isolation by running `yarn start` in the plugin directory.
This method of serving the plugin provides quicker iteration speed and a faster startup and hot reloads.
It is only meant for local development, and the setup for it can be found inside the [/dev](./dev) directory.

## For Administrators

### Prerequisites

Before installing the frontend plugin, ensure that the Scorecard backend is integrated into your Backstage instance. Follow the [Scorecard backend plugin README](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/scorecard/plugins/scorecard-backend/README.md) for setup instructions.

### Installation

To install the Scorecard plugin, run the following command:

```sh
yarn workspace app add @red-hat-developer-hub/backstage-plugin-scorecard
```

**Note**

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

### Configuration

1. Add the Scorecard page to you Entity overview page by modifying `packages/app/src/components/catalog/EntityPage.tsx`:

   ```tsx
   import { ScorecardPage } from '@red-hat-developer-hub/backstage-plugin-scorecard';

   const scorecardRoute = (
     <EntityLayout.Route path="/scorecard" title="Scorecard">
       <ScorecardPage />
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

### Accessing the Plugin

1. Open your Backstage application.
2. Navigate to the Entity overview page from catalog.
3. Explore and analyze scorecard metrics using the scorecards tab.

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

### 3. Translation Key Format

Translation keys follow this pattern:

- **Metric titles**: `metric.{metric-id}.title`
- **Metric descriptions**: `metric.{metric-id}.description`

### 4. Fallback Behavior

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
