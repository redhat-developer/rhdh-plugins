# @red-hat-developer-hub/backstage-plugin-app-react

Shared UI components and extension APIs for the RHDH app shell. Provides the
application drawer system that lets plugins contribute persistent side panels
with host-owned state, and the extensible scaffolder template card.

## Installation

Add the package as a dependency in your plugin or app:

```bash
yarn add @red-hat-developer-hub/backstage-plugin-app-react
```

## App Integration

Register the drawer module in your app's `createApp` call:

```typescript
import { createApp } from '@backstage/frontend-defaults';
import { appDrawerModule } from '@red-hat-developer-hub/backstage-plugin-app-react';

export default createApp({
  features: [
    appDrawerModule,
    // ...other plugins and modules
  ],
});
```

This registers a single wrapper extension (`app-root-wrapper:app/drawer`) that
renders the `ApplicationDrawer` around the app content and accepts drawer
content contributions via inputs. Drawer state is managed by a global singleton
store, so `useAppDrawer()` works from anywhere in the React tree without a
wrapping provider.

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

## Exports

### Main entry (`@red-hat-developer-hub/backstage-plugin-app-react`)

- `AppDrawerContentBlueprint` -- blueprint for contributing drawers
- `appDrawerContentDataRef` -- extension data ref
- `appDrawerExtension` -- drawer wrapper extension
- `appDrawerModule` -- frontend module (registers the drawer wrapper extension)
- `TemplateCardActionBlueprint` -- blueprint for custom template card actions
- `TemplateCardBadgeBlueprint` -- blueprint for template card badges
- `templateCardExtension` -- extensible scaffolder template card component
- `templateCardModule` -- frontend module (registers the template card)
- `useAppDrawer` -- hook to control drawers
- `AppDrawerContent` / `AppDrawerApi` / `ApplicationDrawerProps` / `DrawerPanelProps` types
- `TemplateCardActionData` / `TemplateCardActionProps` / `TemplateCardBadgeData` types

### Legacy entry (`@red-hat-developer-hub/backstage-plugin-app-react/legacy`)

Direct-use OFS components for backward compatibility:

- `ApplicationDrawer` -- drawer renderer component
- `DrawerPanel` -- low-level MUI drawer wrapper
- `useAppDrawer` -- hook to control drawers
- Associated types

### Module entry (`@red-hat-developer-hub/backstage-plugin-app-react/app-drawer-module`)

- Default-exports `appDrawerModule` for Scalprum / module-federation dynamic loading.
