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

2. Add **Bulk import** Sidebar Item in `packages/app/src/components/Root/Root.tsx`:

   ```tsx title="packages/app/src/components/Root/Root.tsx"
   /* highlight-add-next-line */
   import {
     GlobalFloatingButton,
     Slot,
   } from '@red-hat-developer-hub/backstage-plugin-global-floating-action-button';

   export const Root = ({ children }: PropsWithChildren<{}>) => (
     <SidebarPage>
       ... /* highlight-add-start */
       <GlobalFloatingButton
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
