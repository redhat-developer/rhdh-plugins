# @red-hat-developer-hub/backstage-plugin-catalog-techdoc-url-reader-backend

## 0.8.0

### Minor Changes

- 0a42ebd: Bump minor after the release-2.1 cut so main patch versions do not collide with the maintenance line on npm.

## 0.7.0

### Minor Changes

- 3f3a377: Add OCI skill documentation URL reader: read skill source configurations from `catalog.providers.skillsCatalogProvider`, match the exact discovery-resolved connector origin and complete base pathname followed by `/skilldocs/<sourceId>/<digest>`, authenticate via service-to-service tokens, and generate TechDocs-ready MkDocs projects with response ETag caching.

  Reject off-origin URLs, malformed route encoding, authenticated redirects, and successful skill-docs responses lacking a nonblank ETag. Preserve discovery deployment prefixes and prevent skill routes from falling through to legacy model-card matching.

## 0.6.3

### Patch Changes

- 6088511: Backstage version bump to v1.54.6

## 0.6.2

### Patch Changes

- dbce029: Bump ai-integrations workspace to Backstage v1.54.0

## 0.6.1

### Patch Changes

- f7984e7: add remaining unit tests needed for feature readiness

## 0.6.0

### Minor Changes

- 56c40be: Integrate Backstage discovery and auth services for connector communication.

  The model-catalog entity provider now resolves the connector base URL via the
  discovery service and authenticates with backend-to-backend service tokens
  instead of unauthenticated direct HTTP calls. The `fromConfig` factory method
  accepts `discovery` and `auth` as additional required dependencies.

  The techdoc URL reader adds bearer-token authentication when fetching model
  cards and replaces hostname-based bridge URL matching with path-based matching
  that uses the connector plugin ID.

### Patch Changes

- c2e3749: bump workspace to 1.52.0

## 0.5.1

### Patch Changes

- 4418084: Upgrade workspace to Backstage 1.49.4

## 0.5.0

### Minor Changes

- f57ad78: Backstage version bump to v1.45.3

## 0.4.0

### Minor Changes

- 44c967a: Backstage version bump to v1.44.2

## 0.3.0

### Minor Changes

- 986f8ad: Backstage version bump to v1.42.5

## 0.2.2

### Patch Changes

- 551bffa: remove backend catalog dependency

## 0.2.1

### Patch Changes

- 237c394: removing temporary duplicate code for model catalog bridge config now that 'catalog-backend-module-model-config' exposes the requisite types/methods

## 0.2.0

### Minor Changes

- 7dc735d: a new backstage plugin, a sevice factory, is delivered to provide a URLReader that interacts with the model catalog bridges techdoc/model card endpoint; the catalog backend module is also updated so that the bridge configration information is exported and reusable by the techdoc plugin
