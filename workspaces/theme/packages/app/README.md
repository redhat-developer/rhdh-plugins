# app (NFS – main app)

This package is the **main frontend app** for the theme workspace, built on the **New Frontend System (NFS)**. It uses:

- `createApp` from `@backstage/frontend-defaults`
- `convertLegacyApp` from `@backstage/core-compat-api` for hybrid migration
- RHDH themes registered via **ThemeBlueprint** in a `createFrontendModule({ pluginId: 'app', extensions: [...] })`

Existing theme behavior is unchanged: the same `getAllThemes()` from `@red-hat-developer-hub/backstage-plugin-theme` is used; the app registers them as NFS extensions instead of passing `themes` to legacy `createApp`.

## Run

From the theme workspace root:

```bash
# Start backend (in one terminal)
yarn start-backend

# Start app (NFS – default)
yarn start
```

To run the legacy app instead:

```bash
yarn start:legacy
```

Or from this package:

```bash
yarn start
```

See [THEME_NFS_BRIDGE_DESIGN.md](../../docs/THEME_NFS_BRIDGE_DESIGN.md) for the design.
