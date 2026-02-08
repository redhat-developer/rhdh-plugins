# Welcome to the Resource Optimization plugin workspace

## Resource Optimization

Welcome to the Resource Optimization plugin!

Resource Optimization plugin allows users to visualize usage trends and receive optimization recommendations for workloads running on OpenShift clusters.  
There is also an option to automatically apply recommendations. Refer to [Optimizer App](#optimizer-app) section

## Getting started

### Prerequisite

The plugin consumes services from [Red Hat Hybrid Cloud Console](https://console.redhat.com/openshift/cost-management/optimizations), therefore your clusters [must be configured to receive optimization recommendations](https://docs.redhat.com/en/documentation/cost_management_service/1-latest/html-single/getting_started_with_resource_optimization_for_openshift/index).

#### Service Account Details

You will need to two service accounts from Red Hat Hybrid Cloud Console.

- [Use this link](https://console.redhat.com/iam/service-accounts/) to create service accounts

- [please go through this guide](https://docs.redhat.com/en/documentation/cost_management_service/1-latest/html/limiting_access_to_cost_management_resources/assembly-limiting-access-cost-resources-rbac) and assign below roles to your `service accounts`

1. Service account with `Cloud Administrator` role for configuring `Cost Management Metrics Operator`
2. Service account with `Cost OpenShift Viewer` role for viewing the optimization data in the RHDH Resource Optimization plugin

## Setup

You can follow one of these options for installing `Resource Optimization` depending on your environment.

### Option 1: Dynamic plugin - on a Red Hat Developer Hub(RHDH) instance

[Follow this link](./docs/dynamic-plugin.md) for installing plugin as Dynamic Plugin

#### Dependency on Orchestrator plugin and Workflow details

The Resource Optimization plugin is dependent on [Orchestrator plugin](https://www.rhdhorchestrator.io/main/docs/) to run the workflow for applying the recommendation. Make sure you have installed the [Orchestrator plugin](https://www.rhdhorchestrator.io/main/docs/) by following one of these options depending on your environment:

- [Install Orchestrator plugin on an exisiting RHDH instance](https://www.rhdhorchestrator.io/main/docs/installation/installation-on-existing-rhdh/)
- [Install Orchestrator plugin with an RHDH instance](https://www.rhdhorchestrator.io/main/docs/installation/orchestrator/)

This method requires vanilla backstage to be used:

- [Install as a static plugin for local development](https://github.com/redhat-developer/rhdh-plugins/tree/main/workspaces/orchestrator#install-as-a-static-plugin)

**Workflow details** : [Here is the link to the workflow](https://github.com/rhdhorchestrator/serverless-workflows/tree/main/workflows/patch-k8s-resource) which is being used for manually applying the recommendation from the Resource Optimization plugin.

### Option 2: Static plugin - on Vanilla Backstage

1. Add the dependencies

   ```sh
   # From your Backstage root directory
   yarn --cwd packages/app add @red-hat-developer-hub/plugin-redhat-resource-optimization
   yarn --cwd packages/backend add @red-hat-developer-hub/plugin-redhat-resource-optimization-backend
   ```

1. Update your `app-config.yaml` file

   ```yaml
   # app-config.yaml

   proxy:
     endpoints:
       '/cost-management/v1':
         target: https://console.redhat.com/api/cost-management/v1
         allowedHeaders: ['Authorization']
         # See: https://backstage.io/docs/releases/v1.28.0/#breaking-proxy-backend-plugin-protected-by-default
         credentials: dangerously-allow-unauthenticated

   # Replace `${RHHCC_SA_CLIENT_ID}` and `${RHHCC_SA_CLIENT_SECRET}` with the service account credentials.
   costManagement:
     clientId: ${RHHCC_SA_CLIENT_ID}
     clientSecret: ${RHHCC_SA_CLIENT_SECRET}
     optimizationWorkflowId: 'patch-k8s-resource'
   ```

1. Add the back-end plugin to `packages/backend/src/index.ts`

   ```ts
   backend.add(
     import(
       '@red-hat-developer-hub/plugin-redhat-resource-optimization-backend'
     ),
   );
   ```

1. Add the `ResourceOptimizationPage` extension to your `App.tsx` routes

   ```ts
   // packages/app/src/App.tsx

   import { ResourceOptimizationPage } from '@red-hat-developer-hub/plugin-redhat-resource-optimization';

   <FlatRoutes>
     ...
     <Route
       path="/redhat-resource-optimization"
       element={<ResourceOptimizationPage />}
     />
     ...
   </FlatRoutes>;
   ```

1. Add a link to the Resource Optimization page in the side bar

   ```diff
   // packages/app/src/components/Root/Root.tsx

   + import { ResourceOptimizationIconOutlined } from '@red-hat-developer-hub/plugin-redhat-resource-optimization';

   export const Root = ({ children }: PropsWithChildren<{}>) => (
     <SidebarPage>
       <Sidebar>
         <SidebarLogo />
         <SidebarGroup label="Search" icon={<SearchIcon />} to="/search">
           <SidebarSearchModal />
         </SidebarGroup>
         <SidebarDivider />
         <SidebarGroup label="Menu" icon={<MenuIcon />}>
           {/* Global nav, not org-specific */}
           <SidebarItem icon={HomeIcon} to="catalog" text="Home" />
           <SidebarItem icon={ExtensionIcon} to="api-docs" text="APIs" />
           <SidebarItem icon={LibraryBooks} to="docs" text="Docs" />
           <SidebarItem icon={CreateComponentIcon} to="create" text="Create..." />
           {/* End global nav */}
           <SidebarDivider />
           <SidebarScrollWrapper>
             <SidebarItem icon={MapIcon} to="tech-radar" text="Tech Radar" />
           </SidebarScrollWrapper>
   +       <SidebarItem
   +         icon={ResourceOptimizationIconOutlined}
   +         to="/redhat-resource-optimization"
   +         text="Optimizations"
   +       />
         </SidebarGroup>
         <SidebarSpace />
         <SidebarDivider />
         <SidebarGroup
           label="Settings"
           icon={<UserSettingsSignInAvatar />}
           to="/settings"
         >
           <SidebarSettings />
         </SidebarGroup>
       </Sidebar>
       {children}
     </SidebarPage>
   );
   ```

## RBAC Permissions

The HTTP endpoints exposed by the redhat-resource-optimization-backend can enforce authorization if the [RBAC plugin](https://github.com/backstage/community-plugins/tree/main/workspaces/rbac/plugins) is deployed. Please refer the RBAC plugin documentation for the setup steps (mind they rely on the [Backstage authentication and identity](https://backstage.io/docs/auth/)).

- More detailed info about Resource Optimization plugin RBAC permissions can be found in [docs/rbac.md](./docs/rbac.md)
- More detailed info about Orcestrator plugin RBAC for setting up permission for workflow can be [found here](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/orchestrator/docs/Permissions.md).

## Optimizer App

An application for applying the recommendations automatically. The application makes use of OSL (OpenShift Serverless Logic, a.k.a. SonataFlow) which is part of the Orchestrator installation. If you already have the [Orchestrator plugin and the workflow](#dependency-on-orchestrator-plugin-and-workflow-details) installed then you are ready for installing the Optimizer application. Follow the [application instructions](https://github.com/rhdhorchestrator/optimizer/tree/main) for installing and configuring it.
