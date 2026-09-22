# @red-hat-developer-hub/backstage-plugin-boost-toolscope

## 0.2.3

### Patch Changes

- 110e2d1: Rename the first-release AI Catalog package family and update consumers to the new public package identities.

  Move standalone OGX configuration to `ai-catalog.entityProviders.ogx`; the old
  Boost configuration paths are no longer read by this module. Update frontend
  extension IDs to the `ai-catalog` namespace and translation overrides to
  `plugin.ai-catalog`. See the workspace README's consumer migration instructions.

## 0.2.2

### Patch Changes

- a65f815: bump workspace to Backstage 1.54.6

## 0.2.1

### Patch Changes

- 0e772a4: bump workspace to Backstage 1.54.4

## 0.2.0

### Minor Changes

- 238427a: Entity-Provider SDK — Types, Interfaces, Annotation Validation

## 0.1.2

### Patch Changes

- 5551345: Scaffold AI Catalog frontend plugin, dev app, and dev backend. Adds NFS-only frontend plugin with PageBlueprint, EntityCardBlueprint/EntityContentBlueprint stubs, isAiAsset filter, useAiAssets hook, i18n scaffold, and sample catalog fixtures. Adds boost frontend package to pluginPackages in all boost-family packages.

## 0.1.1

### Patch Changes

- 2bf1ba5: bump workspace to Backstage 1.52.0
