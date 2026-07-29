# Dynamic Home Page plugin

This is a dynamic version of the upstream [home page plugin](https://github.com/backstage/backstage/tree/master/plugins/home).

The plugin supports both the **New Frontend System (NFS)** and the **legacy** dynamic plugin model (Scalprum / OFS). NFS is the primary package entry point. OFS exports are available only at `./legacy`. Translations remain available at `./alpha`.

## New Frontend System

The homepage package is its **own** frontend plugin (`pluginId: homepage`) with its own page (`page:homepage`). It works **without** community `@backstage/plugin-home`.

Widgets/layout attach to `page:homepage` on the homepage plugin. Persona-based defaults (`homepage.defaultWidgets` / homepage-backend) are applied only by that layout. When `homepageHomeModule` is installed, the same widgets are mirrored onto community `page:home` (NFS allows only one `attachTo` per extension), but community home keeps the upstream layout and does not call homepage-backend.

```tsx
// packages/app/src/App.tsx
import { createApp } from '@backstage/frontend-defaults';
import {
  homepagePlugin,
  homepageHomeModule, // optional: only if community home is also installed
  homepageTranslationsModule,
} from '@red-hat-developer-hub/backstage-plugin-homepage';

export default createApp({
  features: [
    homepagePlugin,
    homepageTranslationsModule,
    // homepageHomeModule, // optional when using community home alongside
  ],
});
```

### Configuration

```yaml
app:
  extensions:
    # Disable community home when using homepage alone (avoids two home pages)
    - page:home: false

    # Homepage-owned route (configurable)
    - page:homepage:
        config:
          path: / # or /home, /start, etc.

    # Optional: disable homepage instead of community home
    # - page:homepage: false

    - home-page-layout:homepage/dynamic-homepage-layout:
        config:
          customizable: true
          widgetLayout:
            # keys match widget `name` / layout config
            ...
```

Visit tracking (for recently/top visited) still uses community home APIs when that package is installed:

```yaml
app:
  extensions:
    - api:home/visits: true
    - app-root-element:home/visit-listener: true
```

### Plugins / modules

| Export                       | Type             | Description                                                                 |
| ---------------------------- | ---------------- | --------------------------------------------------------------------------- |
| `homepagePlugin` (default)   | `FrontendPlugin` | Own plugin with `page:homepage` + widgets/layout/APIs.                      |
| `homepageHomeModule`         | `FrontendModule` | Optional: mirror RH widgets onto `page:home`; disable toolkit/joke/starred. |
| `homepageTranslationsModule` | `FrontendModule` | i18n translations                                                           |

`homepageTranslationsModule` (`pluginId: 'app'`) is also available as a dedicated Module Federation entry:

- `@red-hat-developer-hub/backstage-plugin-homepage/homepage-translations-module`

### Extensions

- `page:homepage` – Homepage route (config: `path`)
- `home-page-layout:homepage/dynamic-homepage-layout` – persona filtering via homepage-backend (`page:homepage` only)
- `home-page-widget:homepage/...` – Onboarding, Entity, Templates, Quick Access, Search, Featured docs, Recently/Top visited, Catalog starred (mirrored as `home-page-widget:home/...` via `homepageHomeModule`, without RH layout filtering)
- `api:homepage/quickaccess`, `api:homepage/default-widgets`

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
