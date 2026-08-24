# Dynamic Home Page plugin

This is a dynamic version of the upstream [home page plugin](https://github.com/backstage/backstage/tree/master/plugins/home).

The plugin supports both the **New Frontend System (NFS)** and the **legacy** dynamic plugin model (Scalprum / OFS). NFS is the primary package entry point. OFS exports are available only at `./legacy`. Translations remain available at `./alpha`.

## New Frontend System

If you're using Backstage's new frontend system, add the plugin to your app:

```tsx
// packages/app/src/App.tsx
import { createApp } from '@backstage/frontend-defaults';
import {
  homePageModule,
  homepageTranslationsModule,
} from '@red-hat-developer-hub/backstage-plugin-homepage';

export default createApp({
  features: [
    // ... other plugins (nav, signIn, etc.)
    homePageModule,
    homepageTranslationsModule,
  ],
});
```

The plugin will automatically provide:

- A homepage at `/home` (or the path configured via `page:home`)
- Default widgets: Onboarding, Entity Catalog, Templates, Quick Access, Search, Recently Visited, Top Visited, and more
- Customizable or read-only layout based on configuration, default layout being customizable

### Configuration

Add the following to your `app-config.yaml`:

```yaml
app:
  extensions:
    # Register the home page route (default: /)
    - page:home:
        config:
          path: /
    # Enable visit tracking (optional)
    - api:home/visits: true
    - app-root-element:home/visit-listener: true
    # Configure the dynamic homepage layout
    - home-page-layout:home/dynamic-homepage-layout:
        config:
          customizable: true # or false for read-only layout
          widgetLayout:
            RhdhTemplateSection:
              priority: 300 # priority is considered for only Read-only Grid layout
              breakpoints:
                xl: { w: 12, h: 5 }
                lg: { w: 12, h: 5 }
                # ... md, sm, xs, xxs
            RhdhEntitySection:
              priority: 200
              breakpoints:
                xl: { w: 12, h: 7 }
                # ...
            RhdhOnboardingSection:
              priority: 100
              breakpoints:
                xl: { w: 12, h: 6 }
                # ...
```

### Modules

The following modules are available from the primary package entry point:

| Module                       | Description                                                                                                             |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `homePageModule` (default)   | Home page layout and widgets (Onboarding, Entity, Templates, Quick Access, Search, Recently Visited, Top Visited, etc.) |
| `homepageTranslationsModule` | i18n translations (en, de, es, fr, it, ja)                                                                              |

`homepageTranslationsModule` (`pluginId: 'app'`) is also available as a dedicated Module Federation entry:

- `@red-hat-developer-hub/backstage-plugin-homepage/homepage-translations-module`

### Extensions

The `homePageModule` extends the `home` plugin (`@backstage/plugin-home`) with:

- `home-page-layout:home/dynamic-homepage-layout` – Custom layout with config-driven widget arrangement and priority
- `home-page-widget:home/rhdh-onboarding-section` – Onboarding section
- `home-page-widget:home/rhdh-entity-section` – Software catalog section
- `home-page-widget:home/rhdh-template-section` – Templates section
- `home-page-widget:home/quick-access-card` – Quick access card
- `home-page-widget:home/search-bar` – Search bar
- `home-page-widget:home/featured-docs-card` – Featured docs
- `home-page-widget:home/recently-visited` – Recently visited
- `home-page-widget:home/top-visited` – Top visited
- `api:home/quickaccess` – Quick access API

## Legacy System (Dynamic Plugins)

Legacy component imports have been removed from the main package path. OFS consumers must import from `./legacy`, and dynamic plugin config needs `module: Legacy`. See `app-config.dynamic.yaml` in this package for the mount point configuration.

```tsx
import {
  DynamicHomePage,
  OnboardingSection,
  homepageTranslations,
} from '@red-hat-developer-hub/backstage-plugin-homepage/legacy';
```

## Migration

- **NFS**: change imports from `@red-hat-developer-hub/backstage-plugin-homepage/alpha` to `@red-hat-developer-hub/backstage-plugin-homepage`.
- **OFS**: change imports from `@red-hat-developer-hub/backstage-plugin-homepage` to `@red-hat-developer-hub/backstage-plugin-homepage/legacy`, and set `module: Legacy` in dynamic plugin config.
- **Translations**: remain available at `./alpha` (and also on the main and legacy entry points / translations module).
