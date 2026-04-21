# Konflux Plugin Workspace

The Konflux plugin is a Backstage integration plugin that connects Backstage with Konflux (Red Hat's application delivery platform). It aggregates and displays Kubernetes resources (Applications, Components, PipelineRuns, Releases) from multiple clusters and namespaces, providing a unified view of your Konflux resources within Backstage.

## Plugins

- [konflux](./plugins/konflux/README.md) - The frontend plugin for Konflux
- [konflux-backend](./plugins/konflux-backend/README.md) - The backend plugin for Konflux
- [konflux-common](./plugins/konflux-common/README.md) - A common library containing shared utilities to be used across Konflux plugins

## Local Development

### Quick Start

```sh
yarn install
yarn dev
```

This starts both the frontend (http://localhost:3000) and backend (http://localhost:7007). You'll be able to log in as a guest user - no OIDC setup is needed for local development.

However, the Backstage app won't show any Konflux data until you configure a cluster connection. See the sections below.

### Configuration

The workspace uses two config files:

- **`app-config.yaml`** (tracked in git) — contains the base configuration with environment variable placeholders. This file is shared across all developers and should not contain secrets.
- **`app-config.local.yaml`** (gitignored via `*.local.yaml`) — your personal overrides with secrets and cluster configuration. This file is **not** tracked in git and you need to create it yourself.

Backstage merges both files at startup, with `app-config.local.yaml` taking precedence.

#### Creating `app-config.local.yaml`

Create a file named `app-config.local.yaml` in the workspace root (`workspaces/konflux/`) with the following content:

```yaml
auth:
  environment: development
  session:
    secret: 'konflux-local-dev-session-secret-32-chars-minimum'
  providers:
    guest: {}

konflux:
  authProvider: serviceAccount
  clusters:
    my-cluster:
      apiUrl: https://<your-cluster-api-url>:6443
      uiUrl: https://<your-konflux-ui-url>
      serviceAccountToken: <your-service-account-token>
      # Optional: Kubearchive API URL for archived resources
      # kubearchiveApiUrl: https://<your-kubearchive-api-url>
```

Replace the placeholder values with your actual cluster details. See the next section on how to obtain these.

### Konflux Cluster Configuration

Each cluster entry under `konflux.clusters` requires:

| Field                 | Description                                                      |
| --------------------- | ---------------------------------------------------------------- |
| `apiUrl`              | The Kubernetes API URL for the cluster                           |
| `uiUrl`               | The Konflux UI URL used to generate links                        |
| `serviceAccountToken` | A long-lived service account token (see below)                   |
| `kubearchiveApiUrl`   | _(Optional)_ Kubearchive API URL for fetching archived resources |

#### Creating a Service Account and Permissions

To connect to a Konflux cluster, you need a service account with permissions to read Konflux resources in your namespace.

**1. Log in to the cluster and create a service account:**

```sh
oc login <cluster-api-url>
oc create serviceaccount backstage-konflux -n <your-namespace>
```

**2. Create the RBAC configuration:**

Save the following as `backstage-konflux-rbac.yaml` (replace `<your-namespace>`):

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: backstage-konflux-reader
  namespace: <your-namespace>
rules:
  - apiGroups: ['appstudio.redhat.com']
    resources: ['applications', 'components', 'releases']
    verbs: ['list']
  - apiGroups: ['tekton.dev']
    resources: ['pipelineruns', 'taskruns']
    verbs: ['list']
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: backstage-konflux-reader
  namespace: <your-namespace>
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: backstage-konflux-reader
subjects:
  - kind: ServiceAccount
    name: backstage-konflux
    namespace: <your-namespace>
```

**3. Apply the RBAC configuration and create a token:**

```sh
oc apply -f backstage-konflux-rbac.yaml -n <your-namespace>
oc create token backstage-konflux -n <your-namespace> --duration=8760h
```

Copy the token output into the `serviceAccountToken` field in your `app-config.local.yaml`.

> **Note:** The plugin only requires `list` permissions on `applications`, `components`, `releases`, `pipelineruns`, and `taskruns`. The Role above provides the minimum required access.

### Example Entities

The file `examples/entities.yaml` contains sample Backstage catalog entities with Konflux annotations. These entities are automatically loaded by the local Backstage app (configured in `app-config.yaml` under `catalog.locations`).

You need to edit this file to match your cluster and namespace. The key annotation is `konflux-ci.dev/clusters`:

```yaml
annotations:
  konflux-ci.dev/overview: 'true'
  konflux-ci.dev/konflux: 'true'
  konflux-ci.dev/ci: 'true'
  konflux-ci.dev/clusters: |
    - cluster: my-cluster          # Must match a key under konflux.clusters in app-config
      namespace: my-namespace      # Your Konflux namespace
      applications:
        - my-application           # Specific application names, or "*" for all
```

For more details on entity annotations and subcomponent support, see the [main plugin README](./plugins/konflux/README.md).

### Running Tests

```sh
yarn test              # Run tests for changed files
yarn test:all          # Run all tests
yarn tsc               # TypeScript type checking
yarn lint              # Lint changed files
```
