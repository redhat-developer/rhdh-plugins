# @red-hat-developer-hub/backstage-plugin-app-defaults

Defaults app plugin extensions for RHDH. Provides the application drawer system
that lets plugins contribute persistent side panels with host-owned state.

## Installation

Add the package as a dependency in your app:

```bash
yarn add @red-hat-developer-hub/backstage-plugin-app-default
```

## App Integration

Register the `appDefaults` module, or just the drawer module in your app's `createApp` call:

```typescript
import { createApp } from '@backstage/frontend-defaults';
import appDefaultsModule from '@red-hat-developer-hub/backstage-plugin-app-defaults';

export default createApp({
  features: [
    appDefaultsModule,
    // ...other plugins and modules
  ],
});
```

Alternative you can install exported extensions yourself:

```typescript
import { createApp } from '@backstage/frontend-defaults';
import { appDrawerExtensions } from '@red-hat-developer-hub/backstage-plugin-app-defaults';

export const appExtensions = createFrontendModule({
  pluginId: 'app',
  extensions: [...appDrawerExtensions],
});

export default createApp({
  features: [
    appExtensions,
    // ...other plugins and modules
  ],
});
```

## Drawer

### Added extension

This app module registers an app wrapper extension (`app-root-wrapper:app/drawer`)
that renders the `ApplicationDrawer` around the app content and accepts drawer
content contributions via inputs.

The drawer state is managed by a global singleton store. `useAppDrawer()` from
`@red-hat-developer-hub/backstage-plugin-app-react` will work from anywhere
in the React tree without a wrapping provider.

See `@red-hat-developer-hub/backstage-plugin-app-react` for more information
how to contribute a plugin drawer and how to control (open, close, toggle)
drawers.

### App-Config Overrides

Deployers can override `defaultWidth`, `resizable`, and `priority` per-drawer in
`app-config.yaml` without changing plugin code. Config values take precedence
over the `params` set in code:

```yaml
app:
  extensions:
    - app-drawer-content:my-plugin/my-drawer:
        config:
          defaultWidth: 600
          resizable: false
          priority: 10
```
