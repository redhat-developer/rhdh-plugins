# Global floating action button for Backstage

This plugin enables you to add a floating button, with or without submenu options, to your desired pages.

## Getting started

This plugin has been added to the example app in this workspace, meaning it can be accessed by running `yarn start` from this directory, and then navigating to [/test-global-floating-action](http://localhost:3000/test-global-floating-action).

## For administrators

### Installation

#### Installing as a dynamic plugin?

The sections below are relevant for static plugins. If the plugin is expected to be installed as a dynamic one:

- Follow https://github.com/redhat-developer/rhdh/blob/main/docs/dynamic-plugins/installing-plugins.md
- Add content of `app-config.dynamic.yaml` into `app-config.local.yaml`.
- To configure a plugin as a Floating Action Button (FAB), you need to specify the `global.floatingactionbutton/config` mount point in your plugin configuration, as shown below using the bulk-import plugin as an example:

  ```yaml title="dynamic-plugins.yaml"
  - package: ./dynamic-plugins/dist/red-hat-developer-hub-backstage-plugin-bulk-import
    disabled: false
    pluginConfig:
      dynamicPlugins:
        frontend:
          red-hat-developer-hub.backstage-plugin-bulk-import:
            # start of fab config
            mountPoints:
              - mountPoint: global.floatingactionbutton/config
                importName: BulkImportPage # It is necessary to specify an importName because mount point without an associated component is not allowed.
                config:
                  slot: 'page-end'
                  icon: <svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#e8eaed"><g><rect fill="none" height="24" width="24"/></g><g><path d="M11,7L9.6,8.4l2.6,2.6H2v2h10.2l-2.6,2.6L11,17l5-5L11,7z M20,19h-8v2h8c1.1,0,2-0.9,2-2V5c0-1.1-0.9-2-2-2h-8v2h8V19z"/></g></svg>
                  label: 'Bulk import'
                  toolTip: 'Register multiple repositories in bulk'
                  to: /bulk-import/repositories
            # end of fab config
            appIcons:
              - name: bulkImportIcon
                importName: BulkImportIcon
            dynamicRoutes:
              - path: /bulk-import/repositories
                importName: BulkImportPage
                menuItem:
                  icon: bulkImportIcon
                  text: Bulk import
  ```

- To configure Floating Action Button(s) (FAB) that opens an external link, specify the `global.floatingactionbutton/config` mount point in the `backstage-plugin-global-floating-action-button` plugin, as shown below:

  ```yaml title="dynamic-plugins.yaml"
  - package: ./dynamic-plugins/dist/red-hat-developer-hub-backstage-plugin-global-floating-action-button
    disabled: false
    pluginConfig:
      dynamicPlugins:
        frontend:
          red-hat-developer-hub.backstage-plugin-global-floating-action-button:
            mountPoints:
              - mountPoint: application/listener
                importName: DynamicGlobalFloatingActionButton
              - mountPoint: global.floatingactionbutton/config
                importName: NullComponent # It is necessary to specify an importName because mount point without an associated component is not allowed.
                config:
                  icon: '<svg viewBox="0 0 250 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><path d="M200.134 0l55.555 117.514-55.555 117.518h-47.295l55.555-117.518L152.84 0h47.295zM110.08 99.836l20.056-38.092-2.29-8.868L102.847 0H55.552l48.647 102.898 5.881-3.062zm17.766 74.433l-17.333-39.034-6.314-3.101-48.647 102.898h47.295l25-52.88v-7.883z" fill="#40B4E5"/><path d="M152.842 235.032L97.287 117.514 152.842 0h47.295l-55.555 117.514 55.555 117.518h-47.295zm-97.287 0L0 117.514 55.555 0h47.296L47.295 117.514l55.556 117.518H55.555z" fill="#003764"/></svg>'
                  label: 'Quay'
                  showLabel: true
                  toolTip: 'Quay'
                  to: 'https://quay.io'
              - mountPoint: global.floatingactionbutton/config
                importName: NullComponent
                config:
                  icon: github
                  label: 'Git'
                  toolTip: 'Github'
                  to: https://github.com/redhat-developer/rhdh-plugins
  ```

- To configure a Floating Action Button (FAB) that opens multiple options, define the `global.floatingactionbutton/config` mount point in the same `slot` for multiple actions. The default slot is `page-end` when not specified.

  ```yaml title="dynamic-plugins.yaml"
  - package: ./dynamic-plugins/dist/red-hat-developer-hub-backstage-plugin-bulk-import
    disabled: false
    pluginConfig:
      dynamicPlugins:
        frontend:
          red-hat-developer-hub.backstage-plugin-bulk-import:
            # start of fab config
            mountPoints:
              - mountPoint: global.floatingactionbutton/config
                importName: BulkImportPage # It is necessary to specify an importName because mount point without an associated component is not allowed.
                config:
                  slot: 'page-end'
                  icon: <svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#e8eaed"><g><rect fill="none" height="24" width="24"/></g><g><path d="M11,7L9.6,8.4l2.6,2.6H2v2h10.2l-2.6,2.6L11,17l5-5L11,7z M20,19h-8v2h8c1.1,0,2-0.9,2-2V5c0-1.1-0.9-2-2-2h-8v2h8V19z"/></g></svg>
                  label: 'Bulk import'
                  toolTip: 'Register multiple repositories in bulk'
                  to: /bulk-import/repositories
            # end of fab config
            appIcons:
              - name: bulkImportIcon
                importName: BulkImportIcon
            dynamicRoutes:
              - path: /bulk-import/repositories
                importName: BulkImportPage
                menuItem:
                  icon: bulkImportIcon
                  text: Bulk import

  - package: ./dynamic-plugins/dist/red-hat-developer-hub-backstage-plugin-global-floating-action-button
    disabled: false
    pluginConfig:
      dynamicPlugins:
        frontend:
          red-hat-developer-hub.backstage-plugin-global-floating-action-button:
            mountPoints:
              - mountPoint: application/listener
                importName: DynamicGlobalFloatingActionButton
              - mountPoint: global.floatingactionbutton/config
                importName: NullComponent # It is necessary to specify an importName because mount point without an associated component is not allowed.
                config:
                  icon: github
                  label: 'Git'
                  toolTip: 'Github'
                  to: https://github.com/redhat-developer/rhdh-plugins
              - mountPoint: global.floatingactionbutton/config
                importName: NullComponent # It is necessary to specify an importName because mount point without an associated component is not allowed.
                config:
                  icon: '<svg viewBox="0 0 250 300" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid"><path d="M200.134 0l55.555 117.514-55.555 117.518h-47.295l55.555-117.518L152.84 0h47.295zM110.08 99.836l20.056-38.092-2.29-8.868L102.847 0H55.552l48.647 102.898 5.881-3.062zm17.766 74.433l-17.333-39.034-6.314-3.101-48.647 102.898h47.295l25-52.88v-7.883z" fill="#40B4E5"/><path d="M152.842 235.032L97.287 117.514 152.842 0h47.295l-55.555 117.514 55.555 117.518h-47.295zm-97.287 0L0 117.514 55.555 0h47.296L47.295 117.514l55.556 117.518H55.555z" fill="#003764"/></svg>'
                  label: 'Quay'
                  showLabel: true
                  toolTip: 'Quay'
                  to: 'https://quay.io'
  ```

- To configure a Floating Action Button(FAB) to display only on specific pages, configure the `global.floatingactionbutton/config` mount point in the `backstage-plugin-global-floating-action-button` plugin and set the `visibleOnPaths` property, as shown below:

  ```yaml title="dynamic-plugins.yaml"
  - package: ./dynamic-plugins/dist/red-hat-developer-hub-backstage-plugin-bulk-import
    disabled: false
    pluginConfig:
      dynamicPlugins:
        frontend:
          red-hat-developer-hub.backstage-plugin-bulk-import:
            # start of fab config
            mountPoints:
              - mountPoint: global.floatingactionbutton/config
                importName: BulkImportPage # It is necessary to specify an importName because mount point without an associated component is not allowed.
                config:
                  slot: 'page-end'
                  icon: <svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#e8eaed"><g><rect fill="none" height="24" width="24"/></g><g><path d="M11,7L9.6,8.4l2.6,2.6H2v2h10.2l-2.6,2.6L11,17l5-5L11,7z M20,19h-8v2h8c1.1,0,2-0.9,2-2V5c0-1.1-0.9-2-2-2h-8v2h8V19z"/></g></svg>
                  label: 'Bulk import'
                  toolTip: 'Register multiple repositories in bulk'
                  to: /bulk-import/repositories
                  visibleOnPaths: ['/catalog', '/settings']
            # end of fab config
            appIcons:
              - name: bulkImportIcon
                importName: BulkImportIcon
            dynamicRoutes:
              - path: /bulk-import/repositories
                importName: BulkImportPage
                menuItem:
                  icon: bulkImportIcon
                  text: Bulk import
  ```

  In this example, the bulk import Floating Action Button(FAB) is visible only on the `/catalog` and `/settings` pages, while it remains hidden on all other pages.

- To hide a Floating Action Button(FAB) on specific pages, configure the `global.floatingactionbutton/config` mount point in the `backstage-plugin-global-floating-action-button` plugin and set the `excludeOnPaths` property, as shown below:

  ```yaml title="dynamic-plugins.yaml"
  - package: ./dynamic-plugins/dist/red-hat-developer-hub-backstage-plugin-bulk-import
    disabled: false
    pluginConfig:
      dynamicPlugins:
        frontend:
          red-hat-developer-hub.backstage-plugin-bulk-import:
            # start of fab config
            mountPoints:
              - mountPoint: global.floatingactionbutton/config
                importName: BulkImportPage # It is necessary to specify an importName because mount point without an associated component is not allowed.
                config:
                  slot: 'page-end'
                  icon: <svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#e8eaed"><g><rect fill="none" height="24" width="24"/></g><g><path d="M11,7L9.6,8.4l2.6,2.6H2v2h10.2l-2.6,2.6L11,17l5-5L11,7z M20,19h-8v2h8c1.1,0,2-0.9,2-2V5c0-1.1-0.9-2-2-2h-8v2h8V19z"/></g></svg>
                  label: 'Bulk import'
                  toolTip: 'Register multiple repositories in bulk'
                  to: /bulk-import/repositories
                  excludeOnPaths: ['/bulk-import']
            # end of fab config
            appIcons:
              - name: bulkImportIcon
                importName: BulkImportIcon
            dynamicRoutes:
              - path: /bulk-import/repositories
                importName: BulkImportPage
                menuItem:
                  icon: bulkImportIcon
                  text: Bulk import
  ```

  In this example, the bulk import Floating Action Button(FAB) will be hidden on the `/bulk-import` page, while it appears on all other pages.

#### Static Installation

1. Install the Global floating action button plugin using the following command:

   ```console
   yarn workspace app add @red-hat-developer-hub/backstage-plugin-global-floating-action-button
   ```

2. Add **GlobalFloatingActionButton** component to `packages/app/src/components/Root/Root.tsx` with the desired actions you want to associate with your floating buttons:

   ```tsx title="packages/app/src/components/Root/Root.tsx"
   /* highlight-add-next-line */
   import {
     GlobalFloatingActionButton,
     Slot,
   } from '@red-hat-developer-hub/backstage-plugin-global-floating-action-button';

   export const Root = ({ children }: PropsWithChildren<{}>) => (
     <SidebarPage>
       {/* ... */}
       {/* highlight-add-start */}
       <GlobalFloatingActionButton
         floatingButtons={[
           {
             color: 'success',
             icon: <CreateComponentIcon />,
             label: 'Create',
             toolTip: 'Create entity',
             to: '/create',
           },
           {
             slot: Slot.BOTTOM_LEFT,
             icon: <LibraryBooks />,
             label: 'Docs',
             toolTip: 'Docs',
             to: '/docs',
           },
         ]}
       />
       {/* highlight-add-end */}
       {/* ... */}
     </SidebarPage>
   );
   ```

#### Floating Action Button Parameters

| Name               | Type                                                                                                              | Description                                                                                                                                                                                                       | Notes                                          |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **slot**           | `enum`                                                                                                            | The position where the fab will be placed. Valid values: `PAGE_END`, `BOTTOM_LEFT`.                                                                                                                               | [optional] default to `PAGE_END`.              |
| **label**          | `String`                                                                                                          | A name for your action button.                                                                                                                                                                                    | required                                       |
| **labelKey**       | `String`                                                                                                          | Translation key for the label. If provided, will be used instead of label when translations are available.                                                                                                        | optional                                       |
| **icon**           | `String`<br>`React.ReactElement`<br>`SVG image icon`<br>`HTML image icon`                                         | An icon for your floating button. Recommended to use **filled** icons from the [Material Design library](https://fonts.google.com/icons)                                                                          | optional                                       |
| **showLabel**      | `Boolean`                                                                                                         | To display the label next to your icon.                                                                                                                                                                           | optional                                       |
| **size**           | `'small'`<br>`'medium'`<br>`'large'`                                                                              | A name for your action button.                                                                                                                                                                                    | [optional] default to `'medium'`               |
| **color**          | `'default'`<br>`'error'`<br>`'info'`<br>`'inherit'`<br>`'primary'`<br>`'secondary'`<br>`'success'`<br>`'warning'` | The color of the component. It supports both default and custom theme colors, which can be added as shown in the [palette customization guide](https://mui.com/material-ui/customization/palette/#custom-colors). | [optional] default to `'default'`.             |
| **onClick**        | `React.MouseEventHandler`                                                                                         | the action to be performed on `onClick`.                                                                                                                                                                          | optional                                       |
| **to**             | `String`                                                                                                          | Specify an href if the action button should open a internal/external link.                                                                                                                                        | optional                                       |
| **toolTip**        | `String`                                                                                                          | The text to appear on hover.                                                                                                                                                                                      | optional                                       |
| **toolTipKey**     | `String`                                                                                                          | Translation key for the tooltip. If provided, will be used instead of toolTip when translations are available.                                                                                                    | optional                                       |
| **priority**       | `number`                                                                                                          | When multiple sub-menu actions are displayed, the button can be prioritized to position either at the top or the bottom.                                                                                          | optional                                       |
| **visibleOnPaths** | `string[]`                                                                                                        | The action button will appear only on the specified paths and will remain hidden on all other paths.                                                                                                              | [optional] default to displaying on all paths. |
| **excludeOnPaths** | `string[]`                                                                                                        | The action button will be hidden only on the specified paths and will appear on all other paths.                                                                                                                  | [optional] default to displaying on all paths. |

### Translation Support

The Global Floating Action Button plugin supports internationalization (i18n) through translation keys. You can use `labelKey` and `toolTipKey` properties to provide translation keys instead of static text.

#### Using Translation Keys in Dynamic Configuration

```yaml title="dynamic-plugins.yaml"
- package: ./dynamic-plugins/dist/red-hat-developer-hub-backstage-plugin-global-floating-action-button
  disabled: false
  pluginConfig:
    dynamicPlugins:
      frontend:
        red-hat-developer-hub.backstage-plugin-global-floating-action-button:
          mountPoints:
            - mountPoint: application/listener
              importName: DynamicGlobalFloatingActionButton
            - mountPoint: global.floatingactionbutton/config
              importName: NullComponent
              config:
                icon: github
                label: 'GitHub' # Fallback text
                labelKey: 'fab.github.label' # Translation key
                toolTip: 'GitHub Repository' # Fallback text
                toolTipKey: 'fab.github.tooltip' # Translation key
                to: https://github.com/redhat-developer/rhdh-plugins
            - mountPoint: global.floatingactionbutton/config
              importName: NullComponent
              config:
                color: 'success'
                icon: search
                label: 'Create' # Fallback text
                labelKey: 'fab.create.label' # Translation key
                toolTip: 'Create entity' # Fallback text
                toolTipKey: 'fab.create.tooltip' # Translation key
                to: '/create'
                showLabel: true
```

#### Using Translation Keys in Static Configuration

```tsx title="packages/app/src/components/Root/Root.tsx"
import {
  GlobalFloatingActionButton,
  Slot,
} from '@red-hat-developer-hub/backstage-plugin-global-floating-action-button';

export const Root = ({ children }: PropsWithChildren<{}>) => (
  <SidebarPage>
    {/* ... */}
    <GlobalFloatingActionButton
      floatingButtons={[
        {
          color: 'success',
          icon: <CreateComponentIcon />,
          label: 'Create', // Fallback text
          labelKey: 'fab.create.label', // Translation key
          toolTip: 'Create entity', // Fallback text
          toolTipKey: 'fab.create.tooltip', // Translation key
          to: '/create',
        },
        {
          slot: Slot.BOTTOM_LEFT,
          icon: <LibraryBooks />,
          label: 'Docs', // Fallback text
          labelKey: 'fab.docs.label', // Translation key
          toolTip: 'Documentation', // Fallback text
          toolTipKey: 'fab.docs.tooltip', // Translation key
          to: '/docs',
        },
      ]}
    />
    {/* ... */}
  </SidebarPage>
);
```

#### Translation Setup

The plugin automatically registers its translations when loaded. The translation system is built into the plugin configuration and will be available when the plugin is installed.

For dynamic plugins, translations are automatically loaded with the plugin. For static installations, the translations are registered through the plugin's `__experimentalTranslations` configuration.

#### Built-in Translation Keys

The plugin provides built-in translation keys organized under the `fab` namespace:

- `fab.create.label` - "Create"
- `fab.create.tooltip` - "Create entity"
- `fab.docs.label` - "Docs"
- `fab.docs.tooltip` - "Documentation"
- `fab.apis.label` - "APIs"
- `fab.apis.tooltip` - "API Documentation"
- `fab.github.label` - "GitHub"
- `fab.github.tooltip` - "GitHub Repository"
- `fab.bulkImport.label` - "Bulk Import"
- `fab.bulkImport.tooltip` - "Register multiple repositories in bulk"
- `fab.quay.label` - "Quay"
- `fab.quay.tooltip` - "Quay Container Registry"

#### Supported Languages

The plugin includes translations for:

- **English** (default)
- **German** (de)
- **French** (fr)
- **Spanish** (es)

#### How Translation Resolution Works

1. If `labelKey` is provided, the plugin will attempt to resolve the translation key
2. If the translation key is found, it will be used as the label
3. If the translation key is not found, the plugin will fall back to the `label` property
4. The same logic applies to `toolTipKey` and `toolTip`

This ensures backward compatibility while providing translation support when available.

#### Internal Translation Implementation

The plugin uses a centralized translation system where:

- The `useTranslation()` hook is called in components that render floating action buttons to ensure proper translation context initialization
- The translation function (`t`) is passed down to child components that need to resolve translation keys
- This internal architecture prevents infinite re-render loops and ensures stable component rendering
- All components that use `CustomFab` must provide the translation function as a prop

**Note for Developers**: When extending or modifying the plugin components, ensure that the `useTranslation()` hook is called in parent components and the `t` prop is passed to `CustomFab` instances to maintain proper translation functionality and prevent rendering issues.

**NOTE**

If multiple floating button actions are assigned to the same `Slot`, they will appear as sub-menu options within the floating button.
