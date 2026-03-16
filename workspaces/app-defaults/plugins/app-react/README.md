# @red-hat-developer-hub/backstage-plugin-app-react

Shared UI components and extension APIs for the RHDH app shell. Provides the
application drawer system that lets plugins contribute persistent side panels
with host-owned state.

## Installation

Add the package as a dependency in your plugin or app:

```bash
yarn add @red-hat-developer-hub/backstage-plugin-app-react
```

## App Integration

Register the drawer module in your app's `createApp` call:

```typescript
import { createApp } from '@backstage/frontend-defaults';
import { appDrawerModule } from '@red-hat-developer-hub/backstage-plugin-app-react/alpha';

export default createApp({
  features: [
    appDrawerModule,
    // ...other plugins and modules
  ],
});
```

This registers two extensions:

- `app-root-wrapper:app/drawer-provider` -- wraps the app with `AppDrawerProvider` context
- `app-root-element:app/drawer` -- renders the `ApplicationDrawer` outside the app layout

## Plugin Author Guide

### Contributing a Drawer

Use `AppDrawerContentBlueprint` to declare drawer content in your plugin's
`/alpha` export:

```typescript
import { createFrontendPlugin } from '@backstage/frontend-plugin-api';
import { AppDrawerContentBlueprint } from '@red-hat-developer-hub/backstage-plugin-app-react/alpha';

const myDrawerExtension = AppDrawerContentBlueprint.make({
  name: 'my-drawer',
  params: {
    id: 'my-drawer',
    element: <MyDrawerContent />,
    resizable: true,
    defaultWidth: 500,
  },
});

export default createFrontendPlugin({
  pluginId: 'my-plugin',
  extensions: [myDrawerExtension],
});
```

Parameters:

| Param          | Type           | Required | Description                              |
| -------------- | -------------- | -------- | ---------------------------------------- |
| `id`           | `string`       | Yes      | Unique drawer identifier                 |
| `element`      | `ReactElement` | Yes      | Content rendered inside the drawer       |
| `resizable`    | `boolean`      | No       | Enable drag-to-resize (default: `false`) |
| `defaultWidth` | `number`       | No       | Initial width in pixels (default: `500`) |
| `priority`     | `number`       | No       | Ordering priority (higher = first)       |

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

### Opening / Closing a Drawer

Use the `useAppDrawer()` hook from anywhere in the app:

```typescript
import { useAppDrawer } from '@red-hat-developer-hub/backstage-plugin-app-react';

function MyHeaderButton() {
  const { openDrawer } = useAppDrawer();
  return (
    <IconButton onClick={() => openDrawer('my-drawer')}>
      <ChatIcon />
    </IconButton>
  );
}
```

The hook provides:

| Method / Property     | Description                                  |
| --------------------- | -------------------------------------------- |
| `openDrawer(id)`      | Open a drawer (closes any other open drawer) |
| `closeDrawer(id)`     | Close a drawer (no-op if not the active one) |
| `toggleDrawer(id)`    | Toggle open/close                            |
| `isOpen(id)`          | Check if a drawer is active                  |
| `activeDrawerId`      | Currently active drawer id, or `null`        |
| `getWidth(id)`        | Get current width in pixels                  |
| `setWidth(id, width)` | Update width                                 |

### Closing from Inside the Drawer

```typescript
import { useAppDrawer } from '@red-hat-developer-hub/backstage-plugin-app-react';

function MyDrawerContent() {
  const { closeDrawer } = useAppDrawer();
  return (
    <Box>
      <IconButton onClick={() => closeDrawer('my-drawer')}>
        <CloseIcon />
      </IconButton>
      {/* drawer body */}
    </Box>
  );
}
```

## Exports

### Main entry (`@red-hat-developer-hub/backstage-plugin-app-react`)

- `useAppDrawer` -- hook to control drawers
- `AppDrawerProvider` -- context provider (used by the module internally)
- `ApplicationDrawer` -- drawer renderer component
- `DrawerPanel` -- low-level MUI drawer wrapper
- `AppDrawerContent` / `AppDrawerApi` types

### Alpha entry (`@red-hat-developer-hub/backstage-plugin-app-react/alpha`)

- `appDrawerContentDataRef` -- extension data ref
- `AppDrawerContentBlueprint` -- blueprint for contributing drawers
- `appDrawerModule` -- frontend module (registers provider + renderer)
