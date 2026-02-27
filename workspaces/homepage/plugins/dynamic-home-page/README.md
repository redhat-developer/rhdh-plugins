# Dynamic Home Page plugin

This is a dynamic version of the upstream [home page plugin](https://github.com/backstage/backstage/tree/master/plugins/home).

Instead of manually adding supported "home page cards" to a custom route, it allows dynamic plugins to expose such cards. The plugin supports both the **New Frontend System (NFS)** and the **legacy** dynamic plugin model (Scalprum).

## New Frontend System

If you're using Backstage's new frontend system, add the plugin to your app:

```tsx
// packages/app/src/App.tsx
import { createApp } from '@backstage/frontend-defaults';
import {
  homePageDevModule,
  homepageTranslationsModule,
} from '@red-hat-developer-hub/backstage-plugin-dynamic-home-page/alpha';

export default createApp({
  features: [
    // ... other plugins (nav, signIn, etc.)
    homePageDevModule,
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

The following modules are available from the alpha export:

| Module                       | Description                                                                                                             |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `homePageDevModule`          | Home page layout and widgets (Onboarding, Entity, Templates, Quick Access, Search, Recently Visited, Top Visited, etc.) |
| `homepageTranslationsModule` | i18n translations (en, de, es, fr, it, ja)                                                                              |

### Extensions

The `homePageDevModule` extends the `home` plugin (`@backstage/plugin-home`) with:

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

For the legacy Scalprum-based dynamic plugin model, use the main export and configure via `app-config.dynamic.yaml`. See `app-config.dynamic.yaml` in this package for the mount point configuration.
