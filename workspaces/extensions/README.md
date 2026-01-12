# Extensions Plugin

The extensions plugin serves as a catalog for discovering, browsing, and installing plugins within a Backstage/RHDH environment. It provides:

## Features

### Entity Management

The plugin adds three main entity types and uses the Backstage Software Catalog to list available plugins. Users might not see these data in the Software Catalog due Permission/RBAC restrictions.

- **Plugins**: Individual plugins with metadata, installation instructions, and configuration details
- **Packages**: NPM packages that plugins depend on, with version and compatibility information
- **Collections**: Curated lists of related plugins organized by theme or functionality

### Plugin Discovery & Browsing

- **Catalog View**: Main catalog page displaying available plugins in an organized grid format
- **Search & Filtering**: Search plugins by name, description, or filter by categories, etc.
- **Curated Collections**: Organized groups of plugins (e.g., "Featured Plugins", "Kubernetes", "CI/CD")
- **Detailed Plugin Pages**: Information pages for each plugin with metadata, documentation, and installation guides

### Plugin Installation & Management

A tech-preview feature **for non-production** environments to install and configure dynamic plugins from the Extensions catalog.

- **Installation Interface**: Installation pages featuring a YAML configuration editor, incl. examples and documentation
- **Permission-Based Access Control**: RBAC integration for granular permissions which user can read or update configurations

## Architecture

- **Catalog Extension**: Extends the Backstage Software Catalog with new entity kinds (`Plugin`, `Package`, `Collection`)
- **Backend to get catalog entities** even if the user can not read these new kinds from the Software catalog so that any user can see the list of available plugins
- **Detection for Installed Plugins**: Automatically discovers and tracks installed plugins
- **Plugin Management API** provides permission/RBAC protected API endpoints to read or update plugin based configurations for dynamic plugins.
- **File-based Configuration**: Manages plugin configurations currently only through file system operations

## Security & Permissions

!!! note

    Permissions and RBAC rules are implemented to read and update configurations. This is a tech preview feature for **non-production environments**.

    We highly recommend to follow the GitOps approaech to configure and enable plugins in product.

### RBAC Policies

When the Permission framework is enabled with the RBAC plugin, users need appropriate permissions to read or update plugins.

Example `rbac-policy.csv` configuration:

```csv
# define and assign roles
g, user:default/your-username, role:default/extensions-config-reader
g, user:default/your-username, role:default/extensions-config-admin

# assign permission to the roles
p, role:default/extensions-config-reader, extensions.plugin.configuration.read, read, allow
p, role:default/extensions-config-admin, extensions.plugin.configuration.write, create, allow
```

## Getting Started

### Development

To start the development environment:

```bash
git clone https://github.com/redhat-developer/rhdh-plugins.git
cd rhdh-plugins/workspaces/marketplace
yarn install
yarn start
```

Navigate to Extensions on the bottom left.

## Configuration

### Entity Types

The extensions plugin supports three main entity types defined in YAML:

#### Plugin Configuration

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
  packages:
    - name: '@backstage/plugin-search-backend'
      version: '^1.0.0'
```

#### Collection Configuration

```yaml
apiVersion: extensions.backstage.io/v1alpha1
kind: Collection
metadata:
  name: featured-plugins
  title: Featured Plugins
  description: A set of great plugins!
spec:
  type: curated-list
  lifecycle: production
  owner: redhat
  plugins:
    - quay
    - tekton
    - topology
```

## Contributing

This extensions plugin is part of the Red Hat Developer Hub plugins ecosystem. For contribution guidelines, please refer to the main repository documentation.

## License

Licensed under the Apache License, Version 2.0.
