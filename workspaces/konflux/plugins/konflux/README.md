# Konflux Plugin for Backstage

The Konflux plugin is a Backstage integration plugin that connects Backstage with Konflux (Red Hat's application delivery platform). It aggregates and displays Kubernetes resources (Applications, Components, PipelineRuns, Releases) from multiple clusters and namespaces, providing a unified view of your Konflux resources within Backstage.

## Architecture

The plugin consists of three main packages:

### 1. konflux-common (plugins/konflux-common/)

Shared types, models, and utilities used by both frontend and backend:

- Defines resource types: PipelineRun, Application, Component, Release
- Configuration parsing utilities
- Pagination constants and utilities
- Subcomponent utilities
- Shared entity processing utilities

### 2. konflux-backend (plugins/konflux-backend/)

Backend service that fetches resources from Kubernetes clusters:

**Main components:**

- **Router** (`router.ts`): Express router with endpoint `/entity/:entityRef/resource/:resource`
- **KonfluxService** (`services/konflux-service.ts`): Core service that aggregates resources across clusters
- **ResourceFetcherService** (`services/resource-fetcher.ts`): Handles fetching from Kubernetes API and Kubearchive
- **Config helpers** (`helpers/config.ts`): Parses and processes Konflux configuration

### 3. konflux (plugins/konflux/)

Frontend React components:

**Main components:**

- **KonfluxPage**: Main page showing Applications and Components
- **KonfluxCIPage**: CI/CD focused page
- **KonfluxStatus**: Status component
- **LatestReleases**: Latest Releases component

## How It Works

### 1. Configuration

Configuration comes from two sources:

#### App Config (app-config.yaml):

```yaml
konflux:
  authProvider: serviceAccount | oidc | impersonationHeaders
  clusters:
    cluster-name:
      apiUrl: <k8s-api-url>
      uiUrl: <konflux-ui-url>
      serviceAccountToken: <optional-token> # if using either serviceAccount or impersonationHeaders auth providers
      kubearchiveApiUrl: <optional-archive-api-url>
```

#### Entity Annotations (in catalog-info.yaml):

The plugin uses several annotations to control its behavior and configure cluster access:

**Feature Control Annotations:**

- **`konflux-ci.dev/overview: 'true'`**: Enables Konflux components in the entity's Overview tab. When set, the `KonfluxLatestReleases` and `KonfluxStatus` components will be displayed on the Overview page.

- **`konflux-ci.dev/konflux: 'true'`**: Enables the "Konflux" tab in the entity page. When set, a dedicated tab will be available showing the full Konflux page (`KonfluxPageComponent`) with Applications and Components.

- **`konflux-ci.dev/ci: 'true'`**: Enables the "CI/CD" tab in the entity page. When set, a dedicated tab will be available showing the Konflux CI/CD page (`KonfluxCIPageComponent`) with PipelineRuns and Releases.

**Configuration Annotation:**

- **`konflux-ci.dev/clusters`**: Contains the cluster, namespace, and applications configuration. This annotation should be set on subcomponent entities (or the main entity if no subcomponents exist). The format is a YAML array:

```yaml
annotations:
  konflux-ci.dev/clusters: |
    - cluster: cluster-name
      namespace: namespace-name
      applications:
        - application-1
        - application-2
```

### 2. Resource Fetching Flow

```
Frontend Request
    ↓
Backend Router (/entity/:entityRef/resource/:resource)
    ↓
KonfluxService.aggregateResources()
    ↓
1. Fetch entity from Catalog
2. Parse Konflux config (app-config + entity annotations)
   - Extracts subcomponent configs from entity annotations
   - Flattens into array: [{ subcomponent, cluster, namespace, applications }, ...]
   - Falls back to main entity if no subcomponents exist
3. Determine cluster-namespace combinations
   - Groups by subcomponent+cluster+namespace
   - Combines applications for duplicate combinations
4. For each combination:
   ├─ ResourceFetcherService.fetchFromSource()
   │   ├─ Try Kubernetes API first
   │   └─ If exhausted, fallback to Kubearchive
   └─ Filter by applications/labels
    ↓
Aggregate, sort, and return results
```

### 3. Multi-Source Pagination

The plugin supports pagination across:

- Multiple clusters
- Multiple namespaces
- Kubernetes API and Kubearchive

Pagination state is encoded in a continuation token:

- Each source (cluster:namespace) has its own pagination state
- Tracks both K8s API tokens and Kubearchive tokens separately
- When K8s API is exhausted, automatically switches to Kubearchive
- Continuation tokens are user-specific (includes userId for security)

### 4. Authentication

Supports three authentication providers:

- **serviceAccount**: Uses service account tokens
- **impersonationHeaders**: Uses Kubernetes impersonation headers (validates userEmail)
- **[UNSTABLE / NOT TESTED]** **oidc**: Uses OIDC tokens from the frontend (passed via X-OIDC-Token header)

### 5. Frontend Data Fetching

Uses React Query (`@tanstack/react-query`) for:

- Caching (30s stale time, 5min cache time)
- Infinite scrolling/pagination
- Automatic refetching on window focus/reconnect

The `useKonfluxResource` hook:

- Fetches resources for the current entity
- Handles pagination with `loadMore()`
- Automatically gets OIDC tokens when needed

### 6. Subcomponent Support

The plugin supports Backstage subcomponents with a configuration structure:

#### Configuration Structure

- Entities can have `subcomponentOf` relationships
- Each subcomponent can have its own cluster/namespace configuration in its annotations
- Configurations are extracted into a **flattened array**: `SubcomponentClusterConfig[]`
- Each config includes the subcomponent name directly: `{ subcomponent, cluster, namespace, applications }`

#### Internal Representation

The plugin uses a flattened structure:

```typescript
subcomponentConfigs: [
  {
    subcomponent: 'subcomponent-a',
    cluster: 'cluster1',
    namespace: 'ns1',
    applications: ['app1'],
  },
  {
    subcomponent: 'subcomponent-b',
    cluster: 'cluster2',
    namespace: 'ns2',
    applications: ['app2'],
  },
];
```

#### Fallback Behavior

- If no subcomponents exist, the main entity's configuration is used (fallback)
- If subcomponents exist, only their configurations are used (main entity config is ignored)
- The `getSubcomponentsWithFallback` utility handles this logic automatically

## Key Features

- **Multi-cluster aggregation**: Fetches from multiple Kubernetes clusters in parallel
- **Kubearchive integration**: Falls back to archived resources when live K8s API is exhausted
- **Application filtering**: Filters resources by Application name (via labels or spec)
- **Pagination**: Handles pagination across multiple sources with continuation tokens
- **Error handling**: Tracks errors per cluster/namespace and continues fetching from others
- **Subcomponent support**: Aggregates resources across all subcomponents with fallback to main entity

## Installation

### Install the plugin

```bash
# From your Backstage root directory
yarn workspace app add @red-hat-developer-hub/backstage-plugin-konflux
yarn workspace backend add @red-hat-developer-hub/backstage-plugin-konflux-backend
```

### Configure the backend

Add the Konflux backend plugin to your backend:

```typescript
// packages/backend/src/index.ts
import { konfluxPlugin } from '@red-hat-developer-hub/backstage-plugin-konflux-backend';

// ...
backend.add(konfluxPlugin());
```

### Configure app-config.yaml

```yaml
konflux:
  authProvider: serviceAccount # or oidc | impersonationHeaders
  clusters:
    cluster1:
      apiUrl: https://api.cluster1.example.com
      uiUrl: https://ui.cluster1.example.com
      kubearchiveApiUrl: https://archive.cluster1.example.com
      serviceAccountToken: <token> # if using serviceAccount or impersonationHeaders
```

## Example Usage

### Integrating Components in EntityPage

The Konflux plugin provides several components and utility functions for integration into Backstage's EntityPage. Here's how they're typically used:

#### Overview Tab Components

The `KonfluxLatestReleases` and `KonfluxStatus` components can be conditionally displayed in the Overview tab using the `isKonfluxOverviewAvailable` utility:

```tsx
import {
  KonfluxLatestReleases,
  KonfluxStatus,
  isKonfluxOverviewAvailable,
} from '@red-hat-developer-hub/backstage-plugin-konflux';
import { EntitySwitch } from '@backstage/plugin-catalog';
import { Grid } from '@material-ui/core';

const overviewContent = (
  <Grid container spacing={3}>
    {/* Other overview components */}

    <EntitySwitch>
      <EntitySwitch.Case if={isKonfluxOverviewAvailable}>
        <Grid item xs={12}>
          <KonfluxLatestReleases />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>

    <EntitySwitch>
      <EntitySwitch.Case if={isKonfluxOverviewAvailable}>
        <Grid item xs={12}>
          <KonfluxStatus />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>
  </Grid>
);
```

#### Tabs

The `KonfluxPageComponent` and `KonfluxCIPageComponent` can be added as dedicated tabs in the entity page:

```tsx
import {
  KonfluxPageComponent,
  KonfluxCIPageComponent,
  isKonfluxTabAvailable,
  isKonfluxCiTabAvailable,
} from '@red-hat-developer-hub/backstage-plugin-konflux';
import { EntityLayout } from '@backstage/plugin-catalog';

const serviceEntityPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      {overviewContent}
    </EntityLayout.Route>

    <EntityLayout.Route
      path="/konflux-ci"
      title="CI/CD"
      if={isKonfluxCiTabAvailable}
    >
      <KonfluxCIPageComponent />
    </EntityLayout.Route>

    <EntityLayout.Route
      path="/konflux"
      title="Konflux"
      if={isKonfluxTabAvailable}
    >
      <KonfluxPageComponent />
    </EntityLayout.Route>
  </EntityLayout>
);
```

**Note:** The utility functions (`isKonfluxOverviewAvailable`, `isKonfluxTabAvailable`, `isKonfluxCiTabAvailable`) check for the corresponding annotations (`konflux-ci.dev/overview`, `konflux-ci.dev/konflux`, `konflux-ci.dev/ci`) on the entity to determine visibility.

### Complete Configuration Example

This example shows a complete setup with a main component and two subcomponents:

#### App Configuration (app-config.yaml)

```yaml
konflux:
  authProvider: serviceAccount
  clusters:
    cluster1:
      apiUrl: https://api.cluster1.example.com
      uiUrl: https://ui.cluster1.example.com
      kubearchiveApiUrl: https://archive.cluster1.example.com
      serviceAccountToken: ABC123
    cluster2:
      apiUrl: https://api.cluster2.example.com
      uiUrl: https://ui.cluster2.example.com
      serviceAccountToken: DEF456
```

#### Entity Definitions (catalog-info.yaml)

```yaml
---
# Main component entity
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-component
  description: My Component
  title: My Component
  annotations:
    konflux-ci.dev/overview: 'true'
    konflux-ci.dev/konflux: 'true'
    konflux-ci.dev/ci: 'true'
spec:
  type: service
  lifecycle: production
---
# Subcomponent A
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-component-subcomponent-a
  description: Subcomponent A
  title: Subcomponent A
  annotations:
    konflux-ci.dev/overview: 'true'
    konflux-ci.dev/konflux: 'true'
    konflux-ci.dev/ci: 'true'
    konflux-ci.dev/clusters: |
      - cluster: cluster1
        namespace: namespace1
        applications:
          - app1
          - app2
spec:
  subcomponentOf: my-component
  type: service
---
# Subcomponent B
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-component-subcomponent-b
  description: Subcomponent B
  title: Subcomponent B
  annotations:
    konflux-ci.dev/overview: 'true'
    konflux-ci.dev/konflux: 'true'
    konflux-ci.dev/ci: 'true'
    konflux-ci.dev/clusters: |
      - cluster: cluster2
        namespace: namespace2
        applications:
          - app3
spec:
  subcomponentOf: my-component
  type: service
```

#### Internal Configuration Structure

The plugin processes these annotations and creates a flattened configuration array:

```typescript
subcomponentConfigs: [
  {
    subcomponent: 'my-component-subcomponent-a',
    cluster: 'cluster1',
    namespace: 'namespace1',
    applications: ['app1', 'app2'],
  },
  {
    subcomponent: 'my-component-subcomponent-b',
    cluster: 'cluster2',
    namespace: 'namespace2',
    applications: ['app3'],
  },
];
```

**Note:** If no subcomponents existed, the main entity (`my-component`) would be used as a fallback. However, since subcomponents exist, only their configurations are used and the main entity's configuration (if present) would be ignored.

## Resource Types Supported

- **Applications**: `appstudio.redhat.com/v1alpha1`
- **Components**: `appstudio.redhat.com/v1alpha1`
- **PipelineRuns**: `tekton.dev/v1`
- **Releases**: `appstudio.redhat.com/v1alpha1`

The plugin is designed to be extensible, so additional resource types can be added by updating the `konfluxResourceModels` configuration in `konflux-common`.

## Type Definitions

### SubcomponentClusterConfig

```typescript
type SubcomponentClusterConfig = {
  subcomponent: string; // Entity name (subcomponent or main entity)
  cluster: string;
  namespace: string;
  applications: string[];
};
```

### KonfluxConfig

```typescript
interface KonfluxConfig {
  authProvider: 'serviceAccount' | 'oidc' | 'impersonationHeaders';
  clusters: Record<string, KonfluxClusterConfig>;
  subcomponentConfigs: SubcomponentClusterConfig[]; // Flattened array
}
```

## Related Plugins

- [konflux-backend](./../konflux-backend/README.md) - Backend plugin for Konflux
- [konflux-common](./../konflux-common/README.md) - Common library for Konflux plugins
