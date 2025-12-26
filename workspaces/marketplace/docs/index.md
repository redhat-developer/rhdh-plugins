# Extensions Plugin

The extensions plugin serves as a catalog for discovering, browsing, and installing plugins within a Backstage/RHDH environment. It provides:

## Key Features

### Entity Management

The plugin adds three main entity types and uses the Backstage Software Catalog to store these data. Users might not see these data there due Permission/RBAC restrictions.

- **Plugins**: Individual plugins with metadata, installation instructions, and configuration details
- **Packages**: NPM packages that plugins depend on, with version and compatibility information
- **Collections**: Curated lists of related plugins organized by theme or functionality

### Plugin Discovery & Browsing

- **Catalog View**: Main catalog page displaying available plugins in an organized grid format
- **Search & Filtering**: Search plugins by name, description, or filter by categories, etc.
- **Curated Collections**: Organized groups of plugins (e.g., "Featured Plugins", "Kubernetes", "CI/CD")
- **Detailed Plugin Pages**: Information pages for each plugin with metadata, documentation, and installation guides

### Plugin Installation & Management

A tech-preview feature for non-production environments to install and configure dynamic plugins from the Extensions catalog.

- **Installation Interface**: Installation pages featuring a YAML configuration editor, incl. examples and documentation
- **Permission-Based Access Control**: RBAC integration for granular permissions which user can read or update configurations

## Architecture

- **Catalog Extension**: Extends Backstage's software catalog with new entity kinds (`Plugin`, `Package`, `Collection`)
- **Plugin Catalog API to get catalog entities** even if the user can not read these new kinds from the Software catalog so that all any user can see the list of available plugins
- **Plugin Management API** provides permission/RBAC protected API endpoints to read or update plugin based configurations for dynamic plugins.
- **Detection for Installed Plugins**: Automatically discovers and tracks installed plugins
- **File-based Configuration**: Manages plugin configurations currently only through file system operations

## Security & Permissions

### Permission Policies

When RBAC is enabled, users need appropriate permissions. Example configuration:

```csv
p, role:default/team_a, extensions-plugin, read, allow
p, role:default/team_a, extensions-plugin, create, allow
g, user:default/<login-id/user-name>, role:default/team_a
```

## Getting Started

### Installation

1. Install the marketplace plugins:

   ```bash
   yarn add @red-hat-developer-hub/backstage-plugin-extensions
   yarn add @red-hat-developer-hub/backstage-plugin-extensions-backend
   yarn add @red-hat-developer-hub/backstage-plugin-catalog-backend-module-extensions
   ```

2. Add the backend plugin to your `packages/backend/src/index.ts`:

   ```typescript
   backend.add(
     import('@red-hat-developer-hub/backstage-plugin-extensions-backend'),
   );
   backend.add(
     import(
       '@red-hat-developer-hub/backstage-plugin-catalog-backend-module-extensions'
     ),
   );
   ```

3. Add the new entity kinds to your `app-config.yaml`:

   ```yaml
   catalog:
     rules:
       - allow:
           [
             Component,
             System,
             API,
             Resource,
             Location,
             Plugin,
             Package,
             Collection,
           ]
   ```

### Development

To start the development environment:

```bash
yarn install
yarn start
```

Navigate to [http://localhost:3000/extensions](http://localhost:3000/extensions) to access the marketplace.

## Configuration

### Entity Types

The marketplace supports three main entity types defined in YAML:

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

## Tools

The marketplace workspace includes additional tools to help manage plugin entities:

- **[Marketplace CLI](./tools/cli.md)**: Command-line tool for initializing, generating, verifying, and exporting marketplace entities
