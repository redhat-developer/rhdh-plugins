# Configuration

The global header is loaded by the app-defaults feature loader
(`globalHeaderModule`, `globalHeaderPlugin`, `globalHeaderTranslationsModule`).
Deployers customize it with New Frontend System `app.extensions` overrides and
optional `globalHeader.*` config. See the
[New Frontend System Guide](new-frontend-system.md) for contribution APIs.

Old Frontend System / Scalprum `mountPoints` (`application/header`,
`global.header/*`) and the standalone
`@red-hat-developer-hub/backstage-plugin-global-header` package are discontinued.

## Disable the global header

```yaml
app:
  extensions:
    - app-root-wrapper:app/global-header:
        disabled: true
```

## Disable or reorder individual defaults

Extension IDs follow `gh-component:global-header/<name>` and
`gh-menu-item:global-header/<name>`. Examples:

```yaml
app:
  extensions:
    - gh-component:global-header/notification-button:
        disabled: true
    - gh-component:global-header/search:
        config:
          priority: 50
    - gh-menu-item:global-header/settings:
        disabled: true
```

Default names are listed under
[Default toolbar components](new-frontend-system.md#default-toolbar-components)
and [Default menu items](new-frontend-system.md#default-menu-items).

## Related

- [Company logo](components/company-logo.md) — branding, sizing, fallbacks
- [Testing with the Notifications plugin](notifications.md)
- [Migrating from the standalone package](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/app-defaults/plugins/app-react/README.md#migrating-from-red-hat-developer-hubbackstage-plugin-global-header)
