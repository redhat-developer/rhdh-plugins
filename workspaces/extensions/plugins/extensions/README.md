# Extensions frontend plugin for Backstage

The Extensions plugin provides a user interface for browsing, installing, and managing plugins and packages in your Backstage instance. It allows you to discover extensions from the catalog, view plugin details, and install or configure them when the backend supports it.

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

3. Add the Extensions page and sidebar item to your app. See [New Frontend System](#new-frontend-system) for NFS apps or the legacy setup in the example app.

## New Frontend System

If you're using Backstage's new frontend system, add the plugin to your app:

```tsx
// packages/app/src/App.tsx
import extensionsPlugin from '@red-hat-developer-hub/backstage-plugin-extensions/alpha';
import { extensionsTranslationsModule } from '@red-hat-developer-hub/backstage-plugin-extensions/alpha';

export default createApp({
  features: [
    // ...other plugins
    extensionsTranslationsModule,
    extensionsPlugin,
  ],
});
```

The plugin will automatically provide:

- Extensions at `/extensions` with catalog and installed packages tabs
- An "Extensions" navigation item in the sidebar

### Extensions

The following extensions are available in the plugin:

- `api:extensions`
- `api:extensions/dynamic-plugins-info`
- `page:extensions`
- `nav-item:extensions`

## Development

You can serve the plugin in isolation for local development. The setup is in the [dev](./dev) directory.

- **Legacy dev mode**: Run `yarn start:legacy` in the plugin directory to use the legacy app with Full Page and Tabbed Page routers.
- **NFS dev mode**: Run `yarn start:nfs` in the plugin directory to use the new frontend system with mock data.

Both dev modes use mock extensions data and do not require a running backend.
