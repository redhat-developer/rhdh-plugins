# Static Plugin Installation

Follow these instructions to install the orchestrator plugin in a Backstage environment. These instructions assume the code structure has the standard [backstage app structure](https://backstage.io/docs/getting-started/).

## Prerequisites

- Standard Backstage application setup
- SonataFlow infrastructure deployed and accessible
- Node.js and Yarn package manager

## Setting up the Orchestrator backend package

1. Install the Orchestrator backend plugin using the following command:

   ```console
   yarn workspace backend add @red-hat-developer-hub/backstage-plugin-orchestrator-backend
   ```

2. Add the following code to the `packages/backend/src/index.ts` file:

   ```ts title="packages/backend/src/index.ts"
   const backend = createBackend();

   /* highlight-add-next-line */
   backend.add(
     import('@red-hat-developer-hub/backstage-plugin-orchestrator-backend'),
   );

   backend.start();
   ```

## Setting up the Orchestrator frontend package

1. Install the Orchestrator frontend plugin using the following command:

   ```console
   yarn workspace app add @red-hat-developer-hub/backstage-plugin-orchestrator
   ```

2. Add a route to the `OrchestratorPage` and the customized template card component to Backstage App (`packages/app/src/App.tsx`):

   ```tsx title="packages/app/src/App.tsx"
   /* highlight-add-next-line */
   import { OrchestratorPage } from '@red-hat-developer-hub/backstage-plugin-orchestrator';

   const routes = (
     <FlatRoutes>
       {/* ... */}
       {/* highlight-add-next-line */}
       <Route path="/orchestrator" element={<OrchestratorPage />} />
     </FlatRoutes>
   );
   ```

3. Add the Orchestrator to Backstage sidebar (`packages/app/src/components/Root/Root.tsx`):

   ```tsx title="packages/app/src/components/Root/Root.tsx"
   /* highlight-add-next-line */
   import { OrchestratorIcon } from '@red-hat-developer-hub/backstage-plugin-orchestrator';

   export const Root = ({ children }: PropsWithChildren<{}>) => (
     <SidebarPage>
       <Sidebar>
         <SidebarGroup label="Menu" icon={<MenuIcon />}>
           {/* ... */}
           {/* highlight-add-start */}
           <SidebarItem
             icon={OrchestratorIcon}
             to="orchestrator"
             text="Orchestrator"
           />
           {/* highlight-add-end */}
         </SidebarGroup>
         {/* ... */}
       </Sidebar>
       {children}
     </SidebarPage>
   );
   ```

## Configuration

Add the following configuration to your `app-config.yaml`:

```yaml title="app-config.yaml"
backend:
  csp:
    script-src: ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
    script-src-elem: ["'self'", "'unsafe-inline'", "'unsafe-eval'"]
    connect-src: ["'self'", 'http:', 'https:', 'data:']
orchestrator:
  dataIndexService:
    url: <url to SonataFlow data index>
```

The CSP headers are required for the Workflow viewer to load.

> **Note:** To get started quickly with local development, you can also use the [Local Development Configuration](./local-development.md) which includes SonataFlow autoStart capabilities.
