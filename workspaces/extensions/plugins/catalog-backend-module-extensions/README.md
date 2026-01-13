# @red-hat-developer-hub/backstage-plugin-catalog-backend-module-extensions

This is an extension module to the plugin-catalog-backend plugin, providing new kinds of entity and processors that can be used to ingest extensions plugin data.

## Getting Started

This extensions catalog module introduces two new kinds to the software catalog called `Plugin` and `PluginList`.

## Installation

### Install the package

```shell
# From your Backstage root directory
yarn --cwd packages/backend add @red-hat-developer-hub/backstage-plugin-catalog-backend-module-extensions
```

### Adding the plugin to your packages/backend

```typescript
backend.add(
  import(
    '@red-hat-developer-hub/backstage-plugin-catalog-backend-module-extensions'
  ),
);
```

### Allow Plugin and PluginList to import via catalog

Add `Plugin` and `PluginList` kinds to the catalog rules in `app-config.yaml` to import this entities from external locations.

```yaml
catalog:
  rules:
    - allow: [Component, System, API, Resource, Location, Plugin, PluginList]
```

## Configuration

### Extensions Directory Configuration

The module looks for extension YAML files in a directory. You can configure a custom directory path, or the module will use fallback directories.

**Priority order:**

1. Configured directory (if specified in `extensions.directory`)
2. `/extensions` directory (filesystem root)
3. `/marketplace` directory (filesystem root)

**Example configuration:**

```yaml
extensions:
  # Optional: Custom directory path for extension YAML files
  # Can be absolute path or relative to the working directory
  # If not specified, falls back to:
  #   - /extensions (filesystem root)
  #   - /marketplace (filesystem root)
  directory: /path/to/custom/extensions
```

## Plugin configuration YAML Guide:

This YAML file is used to add extensions plugin to the Software catalog in your backstage application.

```yaml
apiVersion: extensions.backstage.io/v1alpha1
kind: Plugin
metadata:
  name: tekton
  title: Pipelines with Tekton
  description: Easily view Tekton PipelineRun status for your services in Backstage.
spec:
  type: frontend-plugin
  lifecycle: production
  owner: redhat
  categories:
    - CI/CD
  developer: Red Hat
  description: |
    # Tekton plugin for Backstage
  installation:
    markdown: |
      # Setting up the Tekton plugin
  packages:
    - name: '@backstage/plugin-search-backend'
      version: '^1.0.0, ^1.1.1'
```

## Structure Overview

The YAML file is structured into the following sections:

- `spec.type`: Defines type of the plugin. Possible values are frontend-plugin, backend-plugin, backend-plugin-module
- `spec.categories`: Defines the categories for the plugin.
- `spec.description`: Description to show in the sidebar.
- `spec.installation.markdown`: Installation guide for the plugin.
- `spec.packages` - Defines all the package names to identify the installation status of the plugin. This field accepts both array of plugin names and JSON format. ie: name, version, backstage and distribution information.

  **_NOTE:_** more examples of the plugins can be seen [here](https://github.com/redhat-developer/rhdh-plugins/tree/main/workspaces/marketplace/examples/plugins).

### PluginList configuration YAML Guide:

This entity allows you to create a curated list of plugins. This YAML file is used to add extensions `PluginList` to the Software catalog in your backstage application.

```yaml
apiVersion: extensions.backstage.io/v1alpha1
kind: PluginList
metadata:
  name: featured-plugins
  title: Featured Plugins
  description: A set of great plugins! :)
spec:
  type: curated-list
  lifecycle: production
  owner: redhat
  plugins:
    - quay
    - 3scale
    - tekton
    - topology
```

## Structure Overview

The YAML file is structured into the following sections:

- `spec.plugins`: Defines a list of the plugins.

  **_NOTE:_** more examples of the plugins can be seen [here](https://github.com/redhat-developer/rhdh-plugins/tree/main/workspaces/marketplace/examples/pluginlists).

## Processors

This module provides different process used to ingest the `plugin` and `pluginList` entity into the software catalog.

- **ExtensionsPluginProcessors** - Ingests `Plugin` entity into the catalog.
- **ExtensionsCollectionProcessors** - Ingests `PluginList` entity into the catalog.
- **LocalPluginInstallStatusProcessor** - Add and Update `entity.spec.installStatus` based on the packages installed in backstage workspaces.
- **DynamicPluginInstallStatusProcessor** - Add and Update `entity.spec.installStatus` based on the dynamic plugin installed in RHDH. This processor will work only when you have [scalprum-backend](https://github.com/janus-idp/backstage-showcase/tree/main/plugins/scalprum-backend) installed in your backstage instance.
