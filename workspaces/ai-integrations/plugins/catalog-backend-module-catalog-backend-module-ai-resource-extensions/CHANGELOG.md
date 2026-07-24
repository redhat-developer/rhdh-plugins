# @red-hat-developer-hub/backstage-plugin-catalog-backend-module-catalog-backend-module-ai-resource-extensions

## 0.3.0

### Minor Changes

- 55088f9: Aggregate multiple AIResource extension errors into a single response.
  Extract OCI validation into a shared `collectOciErrors` function called by
  `AIResourceExtensionsProcessor` so that scope and OCI constraint violations
  are reported together instead of stopping at the first failure.
- 8317e6e: Consolidate OCI location validation into `AIResourceExtensionsProcessor`.
  The standalone `AIResourceOciProcessor` class and its public export have been
  removed; OCI format checks now run via the internal `collectOciErrors` helper
  called by `AIResourceExtensionsProcessor`.

### Patch Changes

- e168046: Add AIResource example YAML files and extend README with schema field
  reference, registration guidance, and OCI validation-only documentation.

## 0.2.0

### Minor Changes

- 6af0114: Add AIResource extension validation via AIResourceExtensionsProcessor, starting with spec.scope
- 67be6ce: Scaffold new AIResource catalog extension and add upstream module to workspace
