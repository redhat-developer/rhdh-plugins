# Global Header Plugin

A configurable and extensible global header for [Red Hat Developer Hub](https://developers.redhat.com/rhdh) (RHDH), built as a [Backstage](https://backstage.io) frontend plugin.

## Features

- Sticky header bar with company logo, search, notifications, and user profile
- Dropdown menus for application launcher, help/support, and user profile
- Extensible via the **new frontend system** (extension blueprints) or **legacy mount points**
- Config-driven menu items via `app-config.yaml` (no code required)
- Full i18n/translation support
- Themeable (light/dark mode, custom branding)

## Installation

```bash
yarn --cwd packages/app add @red-hat-developer-hub/backstage-plugin-global-header
```

## Usage

### New Frontend System

Import the plugin and module in your NFS app:

```typescript
import { createApp } from '@backstage/frontend-defaults';
import globalHeaderPlugin, {
  globalHeaderModule,
} from '@red-hat-developer-hub/backstage-plugin-global-header/alpha';

export default createApp({
  features: [
    // ... other plugins
    globalHeaderModule,
    globalHeaderPlugin,
  ],
});
```

Other plugins can contribute toolbar items and dropdown menu items using `GlobalHeaderComponentBlueprint` and `GlobalHeaderMenuItemBlueprint`. See the [New Frontend System documentation](../../docs/new-frontend-system.md) for detailed examples and API reference.

### Legacy (Mount Points)

For legacy Backstage apps using dynamic plugin mount points, see the [Configuration documentation](../../docs/configuration.md).

## Configuration

### Config-driven toolbar buttons and menu items

Add toolbar buttons and dropdown menu items directly from `app-config.yaml`:

```yaml
globalHeader:
  components:
    - title: Dashboard
      icon: dashboard
      link: /dashboard
      priority: 75

  menuItems:
    - target: app-launcher
      title: Internal Wiki
      icon: article
      link: https://wiki.internal.example.com
      sectionLabel: Resources
      priority: 80
```

### Company logo branding

```yaml
app:
  branding:
    fullLogo:
      light: 'data:image/svg+xml;base64,...'
      dark: 'data:image/svg+xml;base64,...'
    fullLogoWidth: 200px
```

## Documentation

- [New Frontend System Guide](../../docs/new-frontend-system.md) -- Blueprints, building blocks, and integration guide for plugin authors
- [Configuration](../../docs/configuration.md) -- Dynamic plugin setup for legacy apps
- [Components](../../docs/components/) -- HeaderButton, HeaderIconButton, Spacer, Divider reference

## Development

```bash
cd workspaces/global-header
yarn install
yarn start
```

## License

Apache-2.0
