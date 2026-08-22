# @red-hat-developer-hub/backstage-plugin-catalog-backend-module-ai-resource-extensions

## 0.5.1

### Patch Changes

- dbce029: Bump ai-integrations workspace to Backstage v1.54.0

## 0.5.0

### Minor Changes

- 6ddfd98: Use the valid catalog kind spelling `AiResource` (not `AIResource`) in the
  extensions processor, and rename public exports accordingly:
  `AiResourceExtensionsProcessor` and `AiResourceScope`.

## 0.4.0

### Minor Changes

- 238650c: Rename package from the accidentally doubled
  `catalog-backend-module-catalog-backend-module-ai-resource-extensions` path/name
  to `catalog-backend-module-ai-resource-extensions`.

## 0.3.0

### Minor Changes

- 55088f9: Aggregate multiple AiResource extension errors into a single response.
  Extract OCI validation into a shared `collectOciErrors` function called by
  `AiResourceExtensionsProcessor` so that scope and OCI constraint violations
  are reported together instead of stopping at the first failure.
- 8317e6e: Consolidate OCI location validation into `AiResourceExtensionsProcessor`.
  The standalone `AiResourceOciProcessor` class and its public export have been
  removed; OCI format checks now run via the internal `collectOciErrors` helper
  called by `AiResourceExtensionsProcessor`.
- 93847ae: Migrate OCI asset location validation from `spec.location` to the standard
  `backstage.io/source-location` annotation using the Backstage location-ref
  form `url:oci://...`. The annotation is parsed with upstream `parseLocationRef`
  for correct whitespace handling. Bare `oci://...` annotations (without the
  `url:` prefix) are rejected with an actionable error.

### Patch Changes

- e168046: Add AiResource example YAML files and extend README with schema field
  reference, registration guidance, and OCI validation-only documentation.

## 0.2.0

### Minor Changes

- 6af0114: Add AiResource extension validation via AiResourceExtensionsProcessor, starting with spec.scope
- 67be6ce: Scaffold new AiResource catalog extension and add upstream module to workspace
