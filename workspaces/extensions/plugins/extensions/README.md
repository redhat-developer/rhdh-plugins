# Extensions frontend plugin for Backstage

The Extensions plugin provides a user interface for browsing, installing, and managing plugins and packages in your Backstage instance. It allows you to discover extensions from the catalog, view plugin details, and install or configure them when the backend supports it.

The plugin supports both the **legacy** Backstage frontend (OFS) and the **New Frontend System (NFS)**. NFS is the primary package entry point. OFS (legacy) exports are available only at `./legacy`. Translation resources remain available at `./alpha`; the NFS translations module is at `./translations`.

## Package exports

| Sub-path         | Contents                                                                            | Release tag |
| ---------------- | ----------------------------------------------------------------------------------- | ----------- |
| `.`              | NFS plugin (`extensionsPage`, default `createFrontendPlugin`)                       | `@public`   |
| `./alpha`        | Translation ref and resource (`extensionsTranslationRef`, `extensionsTranslations`) | `@alpha`    |
| `./legacy`       | OFS plugin, routers, icons, deprecated Marketplace aliases                          | `@public`   |
| `./translations` | NFS translations module (default export)                                            | `@public`   |

## For administrators

### Installation

#### Prerequisites

1. Follow the [Extensions backend plugin](../extensions-backend/README.md) documentation to integrate the extensions backend in your Backstage instance.
2. Install the [catalog backend module for extensions](../catalog-backend-module-extensions/README.md) (`@red-hat-developer-hub/backstage-plugin-catalog-backend-module-extensions`) in your Backstage instance to provide Plugin and PluginList catalog entities.

---

**NOTE**

- When RBAC permission framework is enabled, for non-admin users to access Extensions UI, the role associated with your user should have the following permission policies associated with it. Add the following in your permission policies configuration file:

```CSV
p, role:default/team_a, extensions-plugin, read, allow
p, role:default/team_a, extensions-plugin, create, allow
g, user:default/<login-id/user-name>, role:default/team_a
```

---

#### Procedure

1. Install the Extensions UI plugin by executing the following command from the Backstage root directory:

   ```console
   yarn workspace app add @red-hat-developer-hub/backstage-plugin-extensions
   ```

2. Install the catalog backend module for extensions in your backend package:

   ```console
   yarn --cwd packages/backend add @red-hat-developer-hub/backstage-plugin-catalog-backend-module-extensions
   ```

   Then add it to `packages/backend/src/index.ts`:

   ```ts
   backend.add(
     import(
       '@red-hat-developer-hub/backstage-plugin-catalog-backend-module-extensions'
     ),
   );
   ```

3. Add the Extensions page and sidebar item to your app. See [New Frontend System](#new-frontend-system-nfs) for NFS apps or [Legacy app (OFS)](#legacy-app-ofs) for the old frontend system.

### New Frontend System (NFS)

If you're using Backstage's new frontend system, add the plugin to your app:

```tsx
// packages/app/src/App.tsx
import extensionsPlugin from '@red-hat-developer-hub/backstage-plugin-extensions';
import translations from '@red-hat-developer-hub/backstage-plugin-extensions/translations';

export default createApp({
  features: [
    // ...other plugins
    translations,
    extensionsPlugin,
  ],
});
```

The plugin will automatically provide:

- Extensions at `/extensions` with catalog and installed packages tabs
- An "Extensions" navigation item in the sidebar

#### NFS extensions

The following extensions are available in the plugin:

- `api:extensions`
- `api:extensions/dynamic-plugins-info`
- `page:extensions`

### Legacy app (OFS)

For the old frontend system, import OFS components and the plugin from `./legacy`. Translation resources still come from `./alpha`:

```tsx
// packages/app-legacy/src/App.tsx
import { DynamicExtensionsPluginRouter as Extensions } from '@red-hat-developer-hub/backstage-plugin-extensions/legacy';
import { extensionsTranslations } from '@red-hat-developer-hub/backstage-plugin-extensions/alpha';

const app = createApp({
  __experimentalTranslations: {
    availableLanguages: ['en', 'de', 'es', 'fr', 'it', 'ja'],
    resources: [extensionsTranslations],
  },
  // ...
});
```

For sidebar icons, import from `./legacy` as well:

```tsx
import { ExtensionsIcon } from '@red-hat-developer-hub/backstage-plugin-extensions/legacy';
```

### Dynamic plugin configuration (RHDH)

When configuring this plugin as a dynamic plugin, OFS exports require `module: Legacy`. Translation resources continue to use `module: Alpha`:

```yaml
dynamicPlugins:
  frontend:
    red-hat-developer-hub.backstage-plugin-extensions:
      translationResources:
        - importName: extensionsTranslations
          ref: extensionsTranslationRef
          module: Alpha
      appIcons:
        - name: pluginsIcon
          module: Legacy
          importName: PluginsIcon
      dynamicRoutes:
        - path: /extensions
          module: Legacy
          importName: DynamicExtensionsPluginRouter
```

See [app-config.dynamic.yaml](./app-config.dynamic.yaml) for the full example.

### Migration notes (NFS graduation)

If you previously imported Extensions NFS APIs from `/alpha` or used the root entry for OFS exports, update as follows.

**1. NFS features registration**

```diff
- import extensionsPlugin, {
-   extensionsTranslationsModule,
- } from '@red-hat-developer-hub/backstage-plugin-extensions/alpha';
+ import extensionsPlugin from '@red-hat-developer-hub/backstage-plugin-extensions';
+ import translations from '@red-hat-developer-hub/backstage-plugin-extensions/translations';

  features: [
-   extensionsTranslationsModule,
+   translations,
    extensionsPlugin,
  ]
```

**2. Legacy (OFS) imports**

OFS components, the OFS plugin, and icons are available only from `./legacy` (not re-exported from the main entry):

```diff
- import { DynamicExtensionsPluginRouter } from '@red-hat-developer-hub/backstage-plugin-extensions';
+ import { DynamicExtensionsPluginRouter } from '@red-hat-developer-hub/backstage-plugin-extensions/legacy';
```

**3. Translations module subpath**

```diff
- import { extensionsTranslationsModule } from '@red-hat-developer-hub/backstage-plugin-extensions/alpha';
+ import translations from '@red-hat-developer-hub/backstage-plugin-extensions/translations';
```

The `./extensions-translations-module` subpath is renamed to `./translations`.

**4. Dynamic plugin `module` fields**

Add `module: Legacy` to `dynamicRoutes` and `appIcons` entries that reference OFS routers and icons. Keep `module: Alpha` for `translationResources`.

## Development

You can serve the plugin in isolation for local development. The setup is in the [dev](./dev) directory.

- **NFS dev mode**: Run `yarn start` in the plugin directory to use the new frontend system with mock data.
- **Legacy dev mode**: Run `yarn start:legacy` in the plugin directory to use the legacy app with Full Page and Tabbed Page routers.

Both dev modes use mock extensions data and do not require a running backend.

To run the full extensions workspace (NFS app + backend):

```bash
cd workspaces/extensions
yarn install
yarn start
```

For the legacy workspace app:

```bash
yarn start:legacy
```
