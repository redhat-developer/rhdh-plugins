# Global floating action button for Backstage

This plugin enables you to add a floating button, with or without submenu options, to your desired pages.

## Getting started

This plugin has been added to the example app in this workspace, meaning it can be accessed by running `yarn start` from this directory, and then navigating to [/test-global-floating-action](http://localhost:3000/test-global-floating-action).

## For administrators

### Installation

#### Procedure

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
       ... /* highlight-add-start */
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
             slot: Slot.BOTTOM_CENTER,
             icon: <LibraryBooks />,
             label: 'Docs',
             toolTip: 'Docs',
             to: '/docs',
           },
         ]}
       />
       /* highlight-add-end */ ...
     </SidebarPage>
   );
   ```

#### Floating Action Button Parameters

| Name               | Type                                                                                                              | Description                                                                                                                                                                                                       | Notes                                          |
| ------------------ | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **slot**           | `enum`                                                                                                            | The position where the fab will be placed. Valid values: `PAGE_END`, `BOTTOM_CENTER`.                                                                                                                             | [optional] default to `PAGE_END`.              |
| **label**          | `String`                                                                                                          | A name for your action button.                                                                                                                                                                                    | required                                       |
| **icon**           | `String`<br>`React.ReactElement`                                                                                  | An icon for your floating button.                                                                                                                                                                                 | optional                                       |
| **showLabel**      | `Boolean`                                                                                                         | To display the label next to your icon.                                                                                                                                                                           | optional                                       |
| **size**           | `'small'`<br>`'medium'`<br>`'large'`                                                                              | A name for your action button.                                                                                                                                                                                    | [optional] default to `'medium'`               |
| **color**          | `'default'`<br>`'error'`<br>`'info'`<br>`'inherit'`<br>`'primary'`<br>`'secondary'`<br>`'success'`<br>`'warning'` | The color of the component. It supports both default and custom theme colors, which can be added as shown in the [palette customization guide](https://mui.com/material-ui/customization/palette/#custom-colors). | [optional] default to `'default'`.             |
| **onClick**        | `React.MouseEventHandler`                                                                                         | the action to be performed on `onClick`.                                                                                                                                                                          | optional                                       |
| **to**             | `String`                                                                                                          | Specify an href if the action button should open a internal/external link.                                                                                                                                        | optional                                       |
| **toolTip**        | `String`                                                                                                          | The text to appear on hover.                                                                                                                                                                                      | optional                                       |
| **priority**       | `number`                                                                                                          | When multiple sub-menu actions are displayed, the button can be prioritized to position either at the top or the bottom.                                                                                          | optional                                       |
| **visibleOnPaths** | `string[]`                                                                                                        | The action button will appear only on the specified paths and will remain hidden on all other paths.                                                                                                              | [optional] default to displaying on all paths. |
| **excludeOnPaths** | `string[]`                                                                                                        | The action button will be hidden only on the specified paths and will appear on all other paths.                                                                                                                  | [optional] default to displaying on all paths. |

**NOTE**

If multiple floating button actions are assigned to the same `Slot`, they will appear as sub-menu options within the floating button.
