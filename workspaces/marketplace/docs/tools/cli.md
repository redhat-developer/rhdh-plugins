# Marketplace CLI

The Marketplace CLI (`@red-hat-developer-hub/extensions-cli`) is a command-line tool for managing Marketplace plugin and package entities. It provides utilities to initialize, generate, verify, and export marketplace entities.

## Installation

Install the CLI globally or use it via `npx`:

```bash
# Using npx (recommended)
npx @red-hat-developer-hub/extensions-cli [command]

# Or install globally
npm install -g @red-hat-developer-hub/extensions-cli
```

## Usage

```bash
npx @red-hat-developer-hub/extensions-cli [command] [options]
```

## Commands

- [`init`](#init) - Initialize marketplace entities for a plugin
- [`generate`](#generate) - Generate Package entities from dynamic plugins configuration
- [`verify`](#verify) - Verify marketplace entities
- [`export-csv`](#export-csv) - Export marketplace entities to CSV files

---

## init

Interactive command to initialize marketplace entities (Plugin and Package) for a new plugin.

### Synopsis

```bash
npx @red-hat-developer-hub/extensions-cli init
```

### Description

The `init` command provides an interactive wizard to create marketplace entities. It detects the plugin structure in the current directory and generates appropriate YAML entities.

**Behavior:**

- If `plugins/*/package.json` folders are found, it will list them as available packages to include
- If no plugin folders are found, it will prompt for package details and offer to create frontend/backend package entities

### Interactive Prompts

1. **Plugin name (display name)**: The human-readable name for the plugin (defaults to the directory name with title case)
2. **NPM package name**: (Only if no plugins found) The npm package name including org (e.g., `@my-org/my-plugin`)
3. **Packages**: Select which packages to include in the plugin entity

### Example

```bash
cd my-backstage-plugin
npx @red-hat-developer-hub/extensions-cli init
```

**Sample output:**

```yaml
apiVersion: extensions.backstage.io/v1alpha1
kind: Plugin
metadata:
  name: my-plugin
  title: My Plugin
  description: Plugin summary
spec:
  description: |-
    # Plugin name

    Full plugin description...
---
apiVersion: extensions.backstage.io/v1alpha1
kind: Package
metadata:
  name: my-org-my-plugin
  title: '@my-org/my-plugin'
spec:
  packageName: '@my-org/my-plugin'
  version: 0.1.0
  partOf:
    - my-plugin
```

---

## generate

Generate Package entities for the marketplace from a dynamic plugins configuration file.

### Synopsis

```bash
npx @red-hat-developer-hub/extensions-cli generate [options]
```

### Options

| Option                                        | Description                                                                                                 |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `-p, --default-dynamic-plugins-config [path]` | Path to the dynamic plugins configuration file (usually `dynamic-plugins.default.yaml` in RHDH source code) |
| `-o, --output-dir [path]`                     | Path to the output directory. Each entity will be written to a separate file                                |
| `--namespace [namespace]`                     | `metadata.namespace` for the generated Package entities                                                     |
| `--owner [owner]`                             | `spec.owner` for the generated Package entities                                                             |

### Description

The `generate` command reads a dynamic plugins configuration file and generates corresponding `Package` entities for the marketplace. This is useful for creating marketplace entries from an existing RHDH deployment's plugin configuration.

**Features:**

- Parses package.json files to extract metadata (name, version, author, links)
- Extracts configuration examples from the dynamic plugins config
- Generates source location annotations
- Handles backend plugin modules with proper naming conventions
- Creates an `all.yaml` Location entity that references all generated packages

### Example

**Generate to stdout:**

```bash
npx @red-hat-developer-hub/extensions-cli generate \
  -p /path/to/rhdh/dynamic-plugins.default.yaml
```

**Generate to directory with namespace:**

```bash
npx @red-hat-developer-hub/extensions-cli generate \
  -p /path/to/rhdh/dynamic-plugins.default.yaml \
  -o ./generated-packages \
  --namespace rhdh \
  --owner group:default/platform-team
```

> **Note:** The `generate` command currently only supports local file paths in the dynamic plugins configuration. OCI image references (e.g., `oci:/quay.io/rhdh/plugin-name:version`) are not supported and will result in a "no such file or directory" error.

**Output structure (when using -o):**

```
generated-packages/
├── all.yaml                    # Location entity referencing all packages
├── backstage-plugin-catalog.yaml
├── backstage-plugin-techdocs.yaml
└── ...
```

---

## verify

Verify a set of marketplace entities for consistency and completeness.

### Synopsis

```bash
npx @red-hat-developer-hub/extensions-cli verify
```

### Description

The `verify` command scans the current directory for YAML files and validates marketplace `Plugin` and `Package` entities. It checks for:

**Package validation:**

- Missing `metadata.title`
- Invalid `spec.partOf` references (plugins that don't exist)

**Plugin validation:**

- Missing `metadata.title`
- Invalid `spec.packages` references (packages that don't exist)
- Missing `spec.documentation`

### Example

```bash
cd /path/to/marketplace-entities
npx @red-hat-developer-hub/extensions-cli verify
```

**Sample output:**

```
Verifying package @backstage/plugin-catalog...
  - missing title
Verifying plugin Catalog...
  - missing package default/non-existent-package
  - missing documentation
```

---

## export-csv

Export marketplace plugin and package entities to CSV files for analysis or reporting.

### Synopsis

```bash
npx @red-hat-developer-hub/extensions-cli export-csv [options]
```

### Options

| Option                           | Description                                                                                             | Default      |
| -------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------ |
| `-p, --plugins-yaml-path [path]` | Path to the plugins folder containing marketplace YAML files. Multiple paths can be separated by commas | **Required** |
| `-o, --output-file [path]`       | Path to the output CSV file (without extension). File extensions are added automatically                | stdout       |
| `-r, --recursive`                | Recursively search for YAML files in each directory                                                     | `false`      |
| `-t, --type [type]`              | Type of CSV to export: `plugin`, `package`, or `all`                                                    | `all`        |

### Description

The `export-csv` command parses marketplace YAML files and generates CSV reports. This is useful for creating spreadsheets for plugin inventory, auditing, or documentation purposes.

**Plugin CSV columns:**

- `name`, `title`, `author`, `categories`, `lifecycle`
- `metadataDescription`, `specDescription`, `support`, `publisher`, `highlights`
- `certified-by`, `verified-by`, `pre-installed`
- `packages`, `backend packages`, `frontend packages`

**Package CSV columns:**

- `name`, `title`, `version`, `author`, `lifecycle`, `packages`, `role`

### Examples

**Export all entities to stdout:**

```bash
npx @red-hat-developer-hub/extensions-cli export-csv \
  -p ./examples/plugins,./examples/packages
```

**Export plugins to files with recursive search:**

```bash
npx @red-hat-developer-hub/extensions-cli export-csv \
  -p ./examples \
  -o ./reports/marketplace \
  -r \
  -t plugin
```

**Output files (when type is "all"):**

```
reports/
├── marketplace-plugins.csv
└── marketplace-packages.csv
```

**Export only packages:**

```bash
npx @red-hat-developer-hub/extensions-cli export-csv \
  -p ./examples/packages \
  -o ./reports/packages-inventory \
  -t package
```

---

## Entity Types

### Plugin Entity

Represents a logical plugin in the marketplace. A plugin can contain one or more packages.

```yaml
apiVersion: extensions.backstage.io/v1alpha1
kind: Plugin
metadata:
  namespace: rhdh
  name: catalog
  title: Catalog
  description: Browse and manage your software catalog
spec:
  author: Backstage
  description: |
    # Catalog Plugin

    Full markdown description...
  packages:
    - rhdh/backstage-plugin-catalog
    - rhdh/backstage-plugin-catalog-backend
  documentation:
    - title: Getting Started
      url: https://backstage.io/docs/features/software-catalog/
```

### Package Entity

Represents an NPM package that can be installed as a dynamic plugin.

```yaml
apiVersion: extensions.backstage.io/v1alpha1
kind: Package
metadata:
  namespace: rhdh
  name: backstage-plugin-catalog
  title: '@backstage/plugin-catalog'
  links:
    - url: https://github.com/backstage/backstage
      title: Source Code
spec:
  owner: group:default/backstage
  packageName: '@backstage/plugin-catalog'
  version: 1.0.0
  backstage:
    role: frontend-plugin
    supportedVersions: '>=1.25.0'
  lifecycle: production
  partOf:
    - catalog
```

---

## Workflows

### Creating a New Plugin Entry

1. Navigate to your plugin directory
2. Run `npx @red-hat-developer-hub/extensions-cli init` to generate base entities
3. Edit the generated YAML to add documentation, categories, etc.
4. Run `npx @red-hat-developer-hub/extensions-cli verify` to validate

### Generating Entries from RHDH

1. Locate your `dynamic-plugins.default.yaml`
2. Run `npx @red-hat-developer-hub/extensions-cli generate -p <path> -o ./entities --namespace rhdh`
3. Review and enhance generated entities
4. Run `npx @red-hat-developer-hub/extensions-cli verify` to validate

### Auditing Existing Plugins

```bash
npx @red-hat-developer-hub/extensions-cli export-csv \
  -p ./plugins,./packages \
  -r \
  -o ./audit/marketplace-inventory
```

---
