# Create a new card

Any plugin can add additional cards/content by exporting a react component.

Cards commonly uses the [InfoCard](https://backstage.io/storybook/?path=/story/layout-information-card--default) component from `@backstage/core-components`.

1. Create and export a new react component:

   ```tsx
   import React from 'react';

   import { InfoCard, MarkdownContent } from '@backstage/core-components';

   export interface MarkdownCardProps {
     title?: string;
     content?: string;
   }

   export const MarkdownCard = (props: MarkdownCardProps) => {
     return (
       <InfoCard title={props.title}>
         <MarkdownContent dialect="gfm" content={props.content ?? ''} />
       </InfoCard>
     );
   };
   ```

2. Export the card in your `plugin.ts`:

   ```tsx
   export const Markdown = dynamicHomePagePlugin.provide(
     createComponentExtension({
       name: 'Markdown',
       component: {
         lazy: () => import('./components/Markdown').then(m => m.Markdown),
       },
     }),
   );
   ```

3. And finally, users can add them to their `app-config` to expose the component as mount point `home.page/cards` (for default cards) or `home.page/widgets` (for additional plugin cards):

   ```yaml
   dynamicPlugins:
     frontend:
       your-plugin-id:
         mountPoints:
           # For default cards that appear by default
           - mountPoint: home.page/cards
             importName: YourHomePageCard
             config:
               title: 'My Custom Card' # Title for "Add widget" dialog
               description: 'Description of what it does' # Description for dialog
               layout: ...
               props: ...
           # For additional cards contributed by plugins
           - mountPoint: home.page/widgets
             importName: YourAdditionalCard
             config:
               title: 'Plugin Card' # Title for "Add widget" dialog
               description: 'Card from external plugin' # Description for dialog
               priority: 10 # Optional: higher priority appears first
               layout: ...
               props: ...
   ```

## Configuration Options

### Metadata (for "Add widget" dialog)

- **`title`** (optional): Display name shown in the "Add widget" dialog
- **`description`** (optional): Description text shown in the "Add widget" dialog

If `title` and `description` are not provided in config, the component will appear in the "Add widget" dialog with its component name or without description.

### Layout and Behavior

- **`priority`** (optional): Number to control display order (higher priority appears first)
- **`layouts`**: Responsive layout configuration for different screen sizes
- **`props`**: Properties passed to the component

## Mount Points

- **`home.page/cards`** - Default homepage cards that appear by default
- **`home.page/widgets`** - Additional cards contributed by other plugins that appear alongside default cards
