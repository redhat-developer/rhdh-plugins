# @red-hat-developer-hub/backstage-plugin-app-react

Shared UI components and extension APIs for the RHDH app shell. Provides the
application drawer system that lets plugins contribute persistent side panels
with host-owned state, the extensible scaffolder template card, and the
blueprints for contributing entries to the priority-ordered app sidebar.

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

### Contributing Sidebar Items and Groups

The sidebar is rendered by the `nav-content:app/sidebar` extension from
`@red-hat-developer-hub/backstage-plugin-app-defaults`. Plugins contribute
entries with `SidebarItemBlueprint` and groups with `SidebarItemGroupBlueprint`:

```typescript
import { createFrontendPlugin } from '@backstage/frontend-plugin-api';
import {
  SidebarItemBlueprint,
  SidebarItemGroupBlueprint,
} from '@red-hat-developer-hub/backstage-plugin-app-react';

const adminGroup = SidebarItemGroupBlueprint.make({
  name: 'admin',
  params: {
    id: 'admin',
    title: 'Administration',
    icon: 'admin', // system icon key registered via IconBundleBlueprint
    priority: -100,
  },
});

const usersItem = SidebarItemBlueprint.make({
  name: 'users',
  params: {
    title: 'Users',
    icon: 'group',
    to: '/admin/users',
    group: 'admin',
    priority: 10,
  },
});

export default createFrontendPlugin({
  pluginId: 'my-plugin',
  extensions: [adminGroup, usersItem],
});
```

`SidebarItemBlueprint` parameters:

| Param      | Type                      | Required | Description                                                |
| ---------- | ------------------------- | -------- | ---------------------------------------------------------- |
| `title`    | `string`                  | Yes      | Text shown next to the icon                                |
| `icon`     | `IconComponent \| string` | No       | Icon component or system icon key (fallback: generic icon) |
| `to`       | `string`                  | No       | Link target. Required for items inside a group             |
| `onClick`  | `() => void`              | No       | Action handler for items that do not navigate              |
| `priority` | `number`                  | No       | Ordering, higher renders first (default: `0`)              |
| `group`    | `string`                  | No       | `id` of the group to render the item in                    |

`SidebarItemGroupBlueprint` parameters:

| Param      | Type                      | Required | Description                                                |
| ---------- | ------------------------- | -------- | ---------------------------------------------------------- |
| `id`       | `string`                  | Yes      | Identifier referenced by `SidebarItemBlueprint.group`      |
| `title`    | `string`                  | Yes      | Text shown next to the icon                                |
| `icon`     | `IconComponent \| string` | No       | Icon component or system icon key (fallback: generic icon) |
| `to`       | `string`                  | No       | Optional link target for the group entry itself            |
| `priority` | `number`                  | No       | Ordering, higher renders first (default: `0`)              |

### Contributing Custom Sidebar Elements

Entries that need their own React component, such as the search modal or the
notifications item, use `SidebarElementBlueprint`. The component renders at
the top level in the slot determined by `priority`; elements cannot be placed
inside a group.

```typescript
import { SidebarElementBlueprint } from '@red-hat-developer-hub/backstage-plugin-app-react';
import { NotificationsSidebarItem } from '@backstage/plugin-notifications';

const notificationsElement = SidebarElementBlueprint.make({
  name: 'notifications',
  params: {
    component: NotificationsSidebarItem,
    priority: -50,
  },
});
```

`SidebarElementBlueprint` parameters:

| Param       | Type                | Required | Description                                   |
| ----------- | ------------------- | -------- | --------------------------------------------- |
| `component` | `ComponentType<{}>` | Yes      | Component rendered in place of a regular item |
| `priority`  | `number`            | No       | Ordering, higher renders first (default: `0`) |

Only `priority` can be overridden from `app-config.yaml`
(`sidebar-element:<plugin>/<name>`).

### Spacers and Dividers

`SidebarSpacerBlueprint` and `SidebarDividerBlueprint` are ready-made elements
from `@backstage/core-components`. A spacer is a fixed 8px gap
(`SidebarSpacer`); with `grow: true` it becomes the flexible `SidebarSpace`
that pushes everything with a lower priority to the bottom of the sidebar. A
divider draws a horizontal line. Both take a `priority`, and the spacer a
`grow` flag, overridable via `sidebar-spacer:<plugin>/<name>` and
`sidebar-divider:<plugin>/<name>`.

```typescript
import {
  SidebarDividerBlueprint,
  SidebarSpacerBlueprint,
} from '@red-hat-developer-hub/backstage-plugin-app-react';

// Everything below priority -30 sits at the bottom, separated by a line.
const bottomSpacer = SidebarSpacerBlueprint.make({
  name: 'bottom',
  params: { priority: -30, grow: true },
});
const bottomDivider = SidebarDividerBlueprint.make({
  name: 'bottom',
  params: { priority: -35 },
});
```

Ordering rules:

- Top-level entries (groups, ungrouped items and custom elements) are sorted
  by `priority`, higher first, ties broken by title (or extension id for
  elements).
- Items inside a group are sorted the same way and render below the group
  entry or in a flyout submenu, depending on the group's `submenu` option. An
  item whose `group` is not registered renders at the top level.
- Nav items that Backstage auto-discovers from page extensions are merged in at
  priority `0`. Declaring an item with the same `to` as an auto-discovered page
  replaces it, so a plugin can retitle, regroup, or reprioritize its own page.
- A custom element with a `to` hides every item and auto-discovered page with
  the same `to`, so for example the search modal replaces the plain search
  page entry.

Deployers can override placement per item in `app-config.yaml`:

```yaml
app:
  extensions:
    - sidebar-item:my-plugin/users:
        config:
          title: People
          priority: 50
          group: directory
    - sidebar-item-group:my-plugin/admin:
        config:
          priority: -10
          submenu: flyout
```

## Exports

### Main entry (`@red-hat-developer-hub/backstage-plugin-app-react`)

- `AppDrawerContentBlueprint` -- blueprint for contributing drawers
- `appDrawerContentDataRef` -- extension data ref
- `appDrawerExtension` -- drawer wrapper extension
- `appDrawerModule` -- frontend module (registers the drawer wrapper extension)
- `SidebarItemBlueprint` / `sidebarItemDataRef` -- blueprint and data ref for sidebar entries
- `SidebarItemGroupBlueprint` / `sidebarItemGroupDataRef` -- blueprint and data ref for sidebar groups
- `SidebarElementBlueprint` / `sidebarElementDataRef` -- blueprint and data ref for custom sidebar components
- `SidebarSpacerBlueprint` / `SidebarDividerBlueprint` -- ready-made spacer and divider elements
- `TemplateCardActionBlueprint` -- blueprint for custom template card actions
- `TemplateCardBadgeBlueprint` -- blueprint for template card badges
- `templateCardExtension` -- extensible scaffolder template card component
- `templateCardModule` -- frontend module (registers the template card)
- `useAppDrawer` -- hook to control drawers
- `AppDrawerContent` / `AppDrawerApi` / `ApplicationDrawerProps` / `DrawerPanelProps` types
- `TemplateCardActionData` / `TemplateCardActionProps` / `TemplateCardBadgeData` types
- `SidebarIcon` / `SidebarItemData` / `SidebarItemGroupData` / `SidebarElementData` types

### Legacy entry (`@red-hat-developer-hub/backstage-plugin-app-react/legacy`)

Direct-use OFS components for backward compatibility:

- `ApplicationDrawer` -- drawer renderer component
- `DrawerPanel` -- low-level MUI drawer wrapper
- `useAppDrawer` -- hook to control drawers
- Associated types

### Module entry (`@red-hat-developer-hub/backstage-plugin-app-react/app-drawer-module`)

- Default-exports `appDrawerModule` for Scalprum / module-federation dynamic loading.
