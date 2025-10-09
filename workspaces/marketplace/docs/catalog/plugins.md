### Plugin Field Reference

#### Standard Backstage Entity Fields

All plugins inherit from Backstage's standard Entity interface and include:

- **`apiVersion`** (required): Must be `extensions.backstage.io/v1alpha1`
- **`kind`** (required): Must be `Plugin`
- **`metadata`** (required): Standard Backstage metadata
  - **`name`** (required): Unique identifier for the plugin
  - **`title`** (optional): Human-readable display name
  - **`description`** (optional): Brief description of the plugin
  - **`namespace`** (optional): Namespace for the plugin (defaults to 'default')
  - **`annotations`** (optional): Key-value pairs for additional metadata
  - **`labels`** (optional): Key-value pairs for categorization
  - **`tags`** (optional): List of tags for organization

#### Plugin-Specific Fields (`spec`)

##### Basic Information

- **`author`** (string, optional): Primary author or maintainer of the plugin
- **`authors`** (array, optional): List of authors with detailed information
  ```yaml
  authors:
    - name: 'John Doe'
      email: 'john@example.com'
      url: 'https://github.com/johndoe'
  ```
- **`developer`** (string, optional): **⚠️ Deprecated** - Use `author` instead

##### Plugin Classification

- **`categories`** (array, optional): List of categories for filtering and organization
  ```yaml
  categories:
    - 'CI/CD'
    - 'Monitoring'
    - 'Security'
  ```
- **`highlights`** (array, optional): Key features or selling points
  ```yaml
  highlights:
    - 'Real-time pipeline monitoring'
    - 'Tekton CRD visualization'
    - 'Multi-cluster support'
  ```

##### Package Dependencies

- **`packages`** (array, optional): List of NPM packages that need to be installed
  ```yaml
  packages:
    - '@backstage/plugin-tekton'
    - '@backstage/plugin-tekton-backend'
  ```

##### Documentation and Content

- **`description`** (string, optional): Detailed markdown description of the plugin
- **`installation`** (string, optional): Markdown-formatted installation instructions
- **`documentation`** (array, optional): Structured documentation sections
  ```yaml
  documentation:
    - type: 'about'
      title: 'About Tekton Plugin'
      tabTitle: 'About'
      markdown: |
        # About the Tekton Plugin
        This plugin provides...
    - type: 'usage'
      title: 'How to Use'
      markdown: |
        ## Usage Instructions
        To use this plugin...
  ```

##### Visual Assets

- **`icon`** (string, optional): URL or path to the plugin's icon
- **`assets`** (array, optional): Additional visual assets
  ```yaml
  assets:
    - type: 'icon'
      filename: 'tekton-icon.svg'
      originUri: 'https://example.com/icon.svg'
    - type: 'image'
      filename: 'screenshot.png'
      originUri: 'https://example.com/screenshot.png'
      encodedData: 'base64encodeddata...'
  ```

##### Support Information

- **`support`** (object, optional): Support and maintenance information
  ```yaml
  support:
    provider: 'Red Hat' # Required: Support provider name, like 'Red Hat', 'IBM', 'Spotify', 'Backstage Community', etc.
    level: 'generally-available' # Required: Support level
  ```

###### Support Level Values

The `support.level` field indicates the maturity and support level
provided bt the `support.provider`. Like:

- **`generally-available`**: Stable, fully supported plugins ready for production use.
- **`tech-preview`**: A technical preview of a plugin that is not fully supported yet.
- **`dev-preview`**: An early-stage plugin.
- **`community`**: Open-source plugins, supported by Community.

##### Installation Status

- **`installStatus`** (enum, optional): Current installation status (automatically populated)
  - `NotInstalled`: Plugin is not installed
  - `Installed`: Plugin is fully installed and active
  - `PartiallyInstalled`: Some components are installed
  - `Disabled`: Plugin is installed but disabled
  - `UpdateAvailable`: A newer version is available

#### Documentation Types

When using the `documentation` field, the following types are supported:

- **`about`**: General information about the plugin
- **`usage`**: How to use the plugin after installation
- **`installation`**: Installation and setup instructions
- **`configuration`**: Configuration options and examples

#### Asset Types

The `assets` field supports:

- **`icon`**: Plugin icons (SVG, PNG, etc.)
- **`image`**: Screenshots, diagrams, or other visual content

#### Complete Example

````yaml
apiVersion: extensions.backstage.io/v1alpha1
kind: Plugin
metadata:
  name: tekton
  title: Pipelines with Tekton
  description: Easily view Tekton PipelineRun status for your services in Backstage
  namespace: default
  annotations:
    extensions.backstage.io/pre-installed: 'true'
  tags:
    - tekton
    - pipelines
    - ci-cd
spec:
  author: 'Backstage Community'
  authors:
    - name: 'Tekton Team'
      email: 'tekton@example.com'
  publisher: 'Red Hat'
  support:
    name: 'Red Hat'
    level: 'generally-available'
  categories:
    - 'CI/CD'
    - 'Kubernetes'
  highlights:
    - 'Real-time pipeline monitoring'
    - 'Tekton CRD visualization'
    - 'Integration with Backstage catalog'
  packages:
    - '@backstage/plugin-tekton'
    - '@backstage/plugin-tekton-backend'
  icon: 'https://tekton.dev/images/tekton-icon.svg'
  description: |
    # Tekton Plugin for Backstage

    This plugin provides comprehensive Tekton pipeline integration for Backstage.
    It allows you to visualize and monitor your Tekton pipelines directly from
    the Backstage interface.

  installation: |
    ## Installation Steps

    1. Install the frontend plugin:
       ```bash
       yarn add @backstage/plugin-tekton
       ```

    2. Install the backend plugin:
       ```bash
       yarn add @backstage/plugin-tekton-backend
       ```

  documentation:
    - type: 'about'
      title: 'About Tekton Plugin'
      markdown: |
        This plugin integrates Tekton Pipelines with Backstage...

    - type: 'usage'
      title: 'Using the Plugin'
      markdown: |
        After installation, you can access Tekton pipelines...

  assets:
    - type: 'icon'
      filename: 'tekton-icon.svg'
      originUri: 'https://tekton.dev/images/tekton-icon.svg'
    - type: 'image'
      filename: 'pipeline-view.png'
      originUri: 'https://example.com/screenshots/pipeline-view.png'
````

# Plugins

## User facing attributes

| Attribute              | Type                                  | Description                                                                               |
| ---------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------- |
| `metadata.description` | `string`                              | Short description that is shown on the cards (text)                                       |
| `spec.author`          | `string`                              | A single author name, this attribute is automatically converted to `authors` if specified |
| `spec.authors`         | `{ name: string, url?: string }[]`    | Authors array if a plugin is developed by multiple authors                                |
| `spec.publisher`       | `string`                              | Who distributes/packages the plugin for RHDH                                              |
| `spec.support`         | `{ provider: string, level: string }` | Support provider and level information                                                    |
| `spec.categories`      | `string[]`                            | Categories are displayed directly as filter and labels                                    |
| `spec.highlights`      | `string[]`                            | Highlights for the details page                                                           |
| `spec.description`     | `string`                              | Full description that is shown on the details page (markdown)                             |
| `spec.installation`    | `string`                              | Full installation description that is shown later on the install page (markdown)          |
| `spec.icon`            | `string`                              | Icon URL                                                                                  |

## Annotations

### Certification

```yaml
metadata:
  annotations:
    extensions.backstage.io/certified-by: Company name
```

### Support type for Core and Community plugins

```yaml
metadata:
  annotations:
    extensions.backstage.io/support-type: Core plugins | Community plugins
```

### Pre-installed / custom plugin

```yaml
metadata:
  annotations:
    extensions.backstage.io/pre-installed: 'true'
```
