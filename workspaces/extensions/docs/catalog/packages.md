# Packages

## Overview

A **Package** is a catalog entity that represents an NPM package or dynamic plugin artifact that can be installed in a Backstage environment. Packages contain metadata about plugin dependencies, installation artifacts, and configuration examples.

Packages are typically referenced by [Plugin](./plugins.md) entities to define their dependencies and installation requirements.

## Entity Structure

### Standard Fields

All Package entities inherit from Backstage's standard Entity interface:

| Field        | Type   | Required | Description                                |
| ------------ | ------ | -------- | ------------------------------------------ |
| `apiVersion` | string | ✅       | Must be `extensions.backstage.io/v1alpha1` |
| `kind`       | string | ✅       | Must be `Package`                          |
| `metadata`   | object | ✅       | Standard Backstage metadata                |

### Metadata Fields

| Field         | Type   | Required | Description                             |
| ------------- | ------ | -------- | --------------------------------------- |
| `name`        | string | ✅       | Unique identifier for the package       |
| `title`       | string | ❌       | Human-readable display name             |
| `description` | string | ❌       | Brief description of the package        |
| `namespace`   | string | ❌       | Namespace (defaults to 'default')       |
| `annotations` | object | ❌       | Key-value pairs for additional metadata |
| `labels`      | object | ❌       | Key-value pairs for categorization      |
| `tags`        | array  | ❌       | List of tags for organization           |

### Package Specification (`spec`)

The `spec` field contains package-specific configuration:

#### Basic Package Information

| Field             | Type   | Required | Description                     | Example                                                    |
| ----------------- | ------ | -------- | ------------------------------- | ---------------------------------------------------------- |
| `packageName`     | string | ❌       | NPM package name                | `"@backstage/plugin-tekton"`                               |
| `version`         | string | ❌       | Package version                 | `"^1.0.0"`                                                 |
| `dynamicArtifact` | string | ❌       | Path to dynamic plugin artifact | `"./dynamic-plugins/dist/backstage-plugin-tekton-dynamic"` |

#### Ownership and Support

| Field     | Type   | Required | Description                                | Example                                           |
| --------- | ------ | -------- | ------------------------------------------ | ------------------------------------------------- |
| `author`  | string | ❌       | Package author or maintainer               | `"Backstage Community"`                           |
| `owner`   | string | ❌       | Team or organization that owns the package | `"platform-team"`                                 |
| `support` | string | ❌       | Support contact or URL                     | `"https://github.com/backstage/backstage/issues"` |

#### Lifecycle and Compatibility

| Field               | Type   | Required | Description                  | Example                                                            |
| ------------------- | ------ | -------- | ---------------------------- | ------------------------------------------------------------------ |
| `lifecycle`         | string | ❌       | Package lifecycle stage      | `"production"`, `"experimental"`, `"deprecated"`                   |
| `role`              | string | ❌       | Backstage plugin role        | `"frontend-plugin"`, `"backend-plugin"`, `"backend-plugin-module"` |
| `supportedVersions` | string | ❌       | Supported Backstage versions | `"^1.0.0"`                                                         |

#### Relationships

| Field    | Type  | Required | Description                             | Example                    |
| -------- | ----- | -------- | --------------------------------------- | -------------------------- |
| `partOf` | array | ❌       | List of plugins this package belongs to | `["tekton", "kubernetes"]` |

#### Configuration Examples

| Field               | Type  | Required | Description                      |
| ------------------- | ----- | -------- | -------------------------------- |
| `appConfigExamples` | array | ❌       | List of app-config.yaml examples |

Each `appConfigExamples` item contains:

| Field     | Type          | Required | Description                       |
| --------- | ------------- | -------- | --------------------------------- |
| `title`   | string        | ✅       | Title of the example              |
| `content` | string/object | ✅       | YAML content or structured object |

#### Installation Status

| Field           | Type | Required | Description                                  |
| --------------- | ---- | -------- | -------------------------------------------- |
| `installStatus` | enum | ❌       | Current installation status (auto-populated) |

Installation status values:

- `NotInstalled` - Package is not installed
- `Installed` - Package is installed and active
- `Disabled` - Package is installed but disabled
- `UpdateAvailable` - A newer version is available

#### Deprecated Fields

| Field       | Type   | Status            | Description        | Replacement                                     |
| ----------- | ------ | ----------------- | ------------------ | ----------------------------------------------- |
| `backstage` | object | ⚠️ **Deprecated** | Backstage metadata | Use `role` and `supportedVersions` under `spec` |

## Examples

### Basic Package

```yaml
apiVersion: extensions.backstage.io/v1alpha1
kind: Package
metadata:
  name: backstage-plugin-tekton
  title: Tekton Plugin Package
  description: Frontend plugin for Tekton pipeline integration
  namespace: default
spec:
  packageName: '@backstage/plugin-tekton'
  version: '^1.4.0'
  author: 'Backstage Community'
  lifecycle: 'production'
  role: 'frontend-plugin'
  supportedVersions: '^1.0.0'
```

### Package with Dynamic Artifact

```yaml
apiVersion: extensions.backstage.io/v1alpha1
kind: Package
metadata:
  name: tekton-backend-dynamic
  title: Tekton Backend Dynamic Plugin
  description: Backend plugin for Tekton integration as dynamic plugin
spec:
  packageName: '@backstage/plugin-tekton-backend'
  version: '^1.4.0'
  dynamicArtifact: './dynamic-plugins/dist/backstage-plugin-tekton-backend-dynamic'
  author: 'Backstage Community'
  owner: 'platform-team'
  support: 'https://github.com/backstage/backstage/issues'
  lifecycle: 'production'
  role: 'backend-plugin'
  supportedVersions: '^1.0.0'
  partOf:
    - 'tekton'
```

### Package with App Config Examples

```yaml
apiVersion: extensions.backstage.io/v1alpha1
kind: Package
metadata:
  name: kubernetes-plugin-package
  title: Kubernetes Plugin Package
  description: Package for Kubernetes integration plugin
spec:
  packageName: '@backstage/plugin-kubernetes'
  version: '^1.2.0'
  author: 'Backstage Community'
  lifecycle: 'production'
  role: 'frontend-plugin'
  supportedVersions: '^1.0.0'
  appConfigExamples:
    - title: 'Basic Kubernetes Configuration'
      content: |
        kubernetes:
          serviceLocatorMethod:
            type: 'multiTenant'
          clusterLocatorMethods:
            - type: 'config'
              clusters:
                - url: https://kubernetes.default.svc
                  name: local-cluster
                  authProvider: 'serviceAccount'
    - title: 'Advanced Kubernetes Configuration'
      content:
        kubernetes:
          serviceLocatorMethod:
            type: 'multiTenant'
          clusterLocatorMethods:
            - type: 'config'
              clusters:
                - url: https://prod-cluster.example.com
                  name: production
                  authProvider: 'aws'
                  skipTLSVerify: false
                  caData: 'LS0tLS1CRUdJTi...'
```

### Complete Package Example

```yaml
apiVersion: extensions.backstage.io/v1alpha1
kind: Package
metadata:
  name: comprehensive-plugin-package
  title: Comprehensive Plugin Package
  description: A fully configured package example
  namespace: extensions
  annotations:
    extensions.backstage.io/pre-installed: 'true'
  labels:
    category: 'ci-cd'
    tier: 'production'
  tags:
    - tekton
    - kubernetes
    - pipelines
spec:
  packageName: '@backstage/plugin-comprehensive'
  version: '^2.1.0'
  dynamicArtifact: './dynamic-plugins/dist/comprehensive-plugin-dynamic'
  author: 'Platform Engineering Team'
  owner: 'platform-team'
  support: 'https://internal.example.com/support'
  lifecycle: 'production'
  role: 'frontend-plugin'
  supportedVersions: '^1.0.0'
  partOf:
    - 'ci-cd-suite'
    - 'developer-tools'
  appConfigExamples:
    - title: 'Basic Configuration'
      content: |
        comprehensive:
          enabled: true
          apiUrl: "https://api.example.com"
    - title: 'Advanced Configuration'
      content:
        comprehensive:
          enabled: true
          apiUrl: 'https://api.example.com'
          features:
            - name: 'feature1'
              enabled: true
            - name: 'feature2'
              enabled: false
          authentication:
            type: 'oauth2'
            clientId: '${OAUTH_CLIENT_ID}'
```

## Usage in Plugins

Packages are typically referenced by Plugin entities in their `packages` field:

```yaml
apiVersion: extensions.backstage.io/v1alpha1
kind: Plugin
metadata:
  name: tekton-plugin
spec:
  packages:
    - '@backstage/plugin-tekton'
    - '@backstage/plugin-tekton-backend'
```

This creates a relationship between the Plugin and its required Package dependencies.

## Best Practices

### Naming Conventions

- Use descriptive names that clearly identify the package purpose
- Include the plugin name and role (e.g., `tekton-backend-package`)
- Use kebab-case for consistency

### Version Management

- Use semantic versioning (SemVer) for package versions
- Specify version ranges appropriately (e.g., `^1.0.0` for compatible versions)
- Keep `supportedVersions` updated with tested Backstage versions

### Documentation

- Provide clear, concise descriptions
- Include comprehensive `appConfigExamples` for configuration-heavy packages
- Document support channels and ownership information

### Lifecycle Management

- Set appropriate lifecycle stages (`experimental`, `production`, `deprecated`)
- Update lifecycle status as packages mature
- Provide migration guidance for deprecated packages

## Related Documentation

- [Plugins](./plugins.md) - Plugin entity documentation
- [Collections](./collections.md) - Collection entity documentation
- [Relationships](./relationships.md) - Entity relationships overview
