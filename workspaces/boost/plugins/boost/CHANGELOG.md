# @red-hat-developer-hub/backstage-plugin-boost

## 0.4.0

### Minor Changes

- 766e4aa: Add extensible browse filters via NFS AiCatalogFilterBlueprint. Deployers can disable built-in filters and third-party plugins can add new filters to the AI Catalog sidebar via app-config.

  **Breaking:** The page extension ID changed from `page:boost` to `page:boost/ai-catalog`. Update any `app.extensions` references in `app-config.yaml` accordingly.

### Patch Changes

- 69b063b: Revert icon imports from @mui/icons-material back to @remixicon/react to align with BUI's internal icon library. Remove unused @mui/icons-material and @mui/material dependencies.

## 0.3.0

### Minor Changes

- 606f57b: Implement AI Catalog browse page with card grid, table view, search, filters, and entity page extensions.

## 0.2.0

### Minor Changes

- 5551345: Scaffold AI Catalog frontend plugin, dev app, and dev backend. Adds NFS-only frontend plugin with PageBlueprint, EntityCardBlueprint/EntityContentBlueprint stubs, isAiAsset filter, useAiAssets hook, i18n scaffold, and sample catalog fixtures. Adds boost frontend package to pluginPackages in all boost-family packages.
