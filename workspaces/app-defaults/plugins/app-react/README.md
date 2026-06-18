# @red-hat-developer-hub/backstage-plugin-app-react

Shared UI components and extension APIs for the RHDH app shell. Provides the
application drawer system that lets plugins contribute persistent side panels
with host-owned state.

## Installation

Add the package as a dependency in your plugin:

```bash
yarn add @red-hat-developer-hub/backstage-plugin-app-react
```

## App Integration

To register the default RHDH modules, and to enable the drawers in your app,
you must install `@red-hat-developer-hub/backstage-plugin-app-defaults`
and register this in your `createApp` or use the Backstage feature auto discovery.

## Plugin Author Guide

### Contributing a Drawer

Use `AppDrawerContentBlueprint` to declare drawer content in your plugin:

```typescript
import { createFrontendPlugin } from '@backstage/frontend-plugin-api';
import { AppDrawerContentBlueprint } from '@red-hat-developer-hub/backstage-plugin-app-react';

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

### Exports

From `@red-hat-developer-hub/backstage-plugin-app-react`:

- `appDrawerContentDataRef` -- extension data ref
- `AppDrawerContentBlueprint` -- blueprint for contributing drawers
- `useAppDrawer` -- hook to control drawers
