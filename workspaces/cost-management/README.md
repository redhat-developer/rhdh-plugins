# Welcome to the Cost Management plugin workspace

## Cost Management

Welcome to the Cost Management plugin!

The Cost Management plugin consists of two main parts:

### 1. OpenShift

The OpenShift section displays cost tracking for OpenShift clusters with flexible grouping options. Users can view costs grouped by cluster, project, node, or tag, monitor month-over-month cost changes, and filter data to analyze spending patterns and identify cost trends.

### 2. Optimizations

The Optimizations section allows users to visualize usage trends and receive optimization recommendations for workloads running on OpenShift clusters. There is also an option to automatically apply recommendations. Refer to [Optimizer App](#optimizer-app) section for more details.

## Getting started

### Prerequisite

The plugin consumes services from [Red Hat Hybrid Cloud Console](https://console.redhat.com/openshift/cost-management) for both OpenShift and Optimizations sections, therefore your clusters [must be configured to access cost management data and optimization recommendations](https://docs.redhat.com/en/documentation/cost_management_service/1-latest/html/integrating_openshift_container_platform_data_into_cost_management/index).

**Learn more:**

- [OpenShift cost tracking and analysis](https://docs.redhat.com/en/documentation/cost_management_service/1-latest/html/analyzing_your_cost_data/index)
- [Resource optimization for OpenShift](https://docs.redhat.com/en/documentation/cost_management_service/1-latest/html-single/getting_started_with_resource_optimization_for_openshift/index)

#### Service Account Details

You will need to two service accounts from Red Hat Hybrid Cloud Console.

- [Use this link](https://console.redhat.com/iam/service-accounts/) to create service accounts

- [please go through this guide](https://docs.redhat.com/en/documentation/cost_management_service/1-latest/html/limiting_access_to_cost_management_resources/assembly-limiting-access-cost-resources-rbac) and assign below roles to your `service accounts`

1. Service account with `Cloud Administrator` role for configuring `Cost Management Metrics Operator`
2. Service account with `Cost OpenShift Viewer` role for viewing both OpenShift cost data and optimization recommendations in the Cost Management plugin

## Setup

You can follow one of these options for installing `Cost Management` plugin depending on your environment.

### Option 1: Dynamic plugin - on a Red Hat Developer Hub(RHDH) instance

[Follow this link](./docs/dynamic-plugin.md) for installing plugin as Dynamic Plugin

#### Dependency on Orchestrator plugin and Workflow details

The Cost Management plugin's Optimizations section is dependent on [Orchestrator plugin](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.8/html/orchestrator_in_red_hat_developer_hub/index) to run the workflow for applying the recommendation. Make sure you have installed the [Orchestrator plugin](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.8/html/orchestrator_in_red_hat_developer_hub/index) by following one of these options depending on your environment:

- [Installing Red Hat Developer Hub with Orchestrator by using the Red Hat Developer Hub Operator](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.8/html/orchestrator_in_red_hat_developer_hub/assembly-install-rhdh-orchestrator-operator)
- [Installing Red Hat Developer Hub with Orchestrator by using the Red Hat Developer Hub Helm chart](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.8/html/orchestrator_in_red_hat_developer_hub/assembly-install-rhdh-orchestrator-helm)

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

   Add the import and a single route. The plugin handles its own sub-routes:

   - `/redhat-resource-optimization` — Optimizations list
   - `/redhat-resource-optimization/ocp` — OpenShift cost management
   - `/redhat-resource-optimization/:id` — Optimization breakdown

   ```tsx
   // packages/app/src/App.tsx

   import { ResourceOptimizationPage } from '@red-hat-developer-hub/plugin-redhat-resource-optimization';

   const routes = (
     <FlatRoutes>
       {/* ... other routes ... */}
       <Route
         path="/redhat-resource-optimization"
         element={<ResourceOptimizationPage />}
       />
       {/* ... */}
     </FlatRoutes>
   );
   ```

   ```

   ```

1. Add a link to the Cost Management page in the side bar

   The plugin provides a single sidebar item that gives access to the Cost Management plugin. The plugin internally handles navigation between the OpenShift and Optimizations sections through tabs within the plugin interface.

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
   +         text="Cost Management"
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

   Once added to the sidebar, users can navigate between sections using the plugin's internal navigation tabs.

## RBAC Permissions

The HTTP endpoints exposed by the redhat-resource-optimization-backend can enforce authorization if the [RBAC plugin](https://github.com/backstage/community-plugins/tree/main/workspaces/rbac/plugins) is deployed. Please refer the RBAC plugin documentation for the setup steps (mind they rely on the [Backstage authentication and identity](https://backstage.io/docs/auth/)).

- More detailed info about Cost Management plugin RBAC permissions can be found in [docs/rbac.md](./docs/rbac.md)
- More detailed info about Orcestrator plugin RBAC for setting up permission for workflow can be [found here](https://github.com/redhat-developer/rhdh-plugins/blob/main/workspaces/orchestrator/docs/Permissions.md).

## Optimizer App

An application for applying the recommendations automatically. The application makes use of OSL (OpenShift Serverless Logic, a.k.a. SonataFlow) which is part of the Orchestrator installation. If you already have the [Orchestrator plugin and the workflow](#dependency-on-orchestrator-plugin-and-workflow-details) installed then you are ready for installing the Optimizer application. Follow the [application instructions](https://github.com/rhdhorchestrator/optimizer/tree/main) for installing and configuring it.

## References

- [Installing ROS-OCP RHDH plugin on Red Hat Developer Hub on a Openshift Cluster](https://docs.google.com/document/d/1tExe7cEBYMJplkk9ppSdBINwE-14KmxURczGjloHqZ4/edit?usp=sharing)

- [Documentation to understand how to export, package & publish plugin as a dynamic plugin](https://github.com/redhat-developer/rhdh/blob/main/docs/dynamic-plugins/packaging-dynamic-plugins.md#packaging-and-publishing-backstage-plugin-as-a-dynamic-plugin)

- For comprehensive RHDH documentation, visit: [Red Hat Developer Hub 1.8 Documentation](https://docs.redhat.com/en/documentation/red_hat_developer_hub/1.8/)
