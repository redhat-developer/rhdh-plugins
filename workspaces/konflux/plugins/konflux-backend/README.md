# Konflux Backend Plugin

The Konflux backend plugin provides the backend service for fetching and aggregating Kubernetes resources from multiple clusters and namespaces.

## Overview

This backend plugin handles:

- Fetching resources from Kubernetes clusters via the Kubernetes API
- Falling back to Kubearchive when the Kubernetes API is exhausted
- Aggregating resources across multiple clusters and namespaces
- Supporting multiple authentication methods (serviceAccount, OIDC, impersonationHeaders)
- Pagination across multiple sources with continuation tokens
- Subcomponent support with fallback to main entity

## Main Components

- **Router** (`router.ts`): Express router with endpoint `/entity/:entityRef/resource/:resource`
- **KonfluxService** (`services/konflux-service.ts`): Core service that aggregates resources across clusters
- **ResourceFetcherService** (`services/resource-fetcher.ts`): Handles fetching from Kubernetes API and Kubearchive
- **KubearchiveService** (`services/kubearchive-service.ts`): Service for fetching archived resources
- **Config helpers** (`helpers/config.ts`): Parses and processes Konflux configuration

## Installation

```bash
yarn workspace backend add @red-hat-developer-hub/backstage-plugin-konflux-backend
```

## Configuration

Add the plugin to your backend:

```typescript
// packages/backend/src/index.ts
import { konfluxPlugin } from '@red-hat-developer-hub/backstage-plugin-konflux-backend';

backend.add(konfluxPlugin());
```

Configure in `app-config.yaml`:

```yaml
konflux:
  authProvider: serviceAccount # or oidc | impersonationHeaders
  clusters:
    cluster1:
      apiUrl: ${CLUSTER_1_API_URL}
      uiUrl: ${CLUSTER_1_UI_URL}
      kubearchiveApiUrl: ${CLUSTER_1_KUBEARCHIVE_API_URL}
      serviceAccountToken: ${CLUSTER_1_SA_ACCOUNT_TOKEN} # if using serviceAccount or impersonationHeaders
```

For detailed documentation, see the [main plugin README](../konflux/README.md).
