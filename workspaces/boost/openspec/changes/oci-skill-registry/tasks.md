# Tasks: OCI Skill Registry Connector

## 1. OCI Client Integration (P0)

- [ ] 1.1 Evaluate and select Node.js OCI Distribution Spec client library (`oras-js` or equivalent) (RHIDP-15296)
- [ ] 1.2 Implement `OciRegistryClient` class with methods: `listTags()`, `getManifest()`, `getBlob()` (RHIDP-15296)
- [ ] 1.3 Implement auth provider interface with `BasicAuthProvider`, `BearerTokenAuthProvider`, `DockerTokenAuthProvider` (RHIDP-15297)
- [ ] 1.4 Add custom CA bundle support via HTTPS agent configuration (RHIDP-15297)
- [ ] 1.5 Write unit tests for OCI client with mocked registry responses (RHIDP-15296)

## 2. Skillcard Extraction and Validation (P0)

- [ ] 2.1 Implement layer blob download with streaming decompression (gzip, zstd) (RHIDP-15296)
- [ ] 2.2 Implement tar stream parser to extract `skillcard.yaml` from layer blobs (RHIDP-15296)
- [ ] 2.3 Integrate SDK schema validator for `skillcard.yaml` validation (RHIDP-15296)
- [ ] 2.4 Implement error handling for missing/invalid `skillcard.yaml` with descriptive logs (RHIDP-15296)
- [ ] 2.5 Write unit tests for skillcard extraction from multi-layer images (RHIDP-15296)
- [ ] 2.6 Write unit tests for schema validation with valid/invalid skillcards (RHIDP-15296)

## 3. Entity Emission (P0)

- [ ] 3.1 Implement `OciSkillRegistryProvider` class extending `EntityProvider` interface (RHIDP-15296)
- [ ] 3.2 Implement entity factory: convert `skillcard.yaml` to Backstage `Resource` entity (RHIDP-15296)
- [ ] 3.3 Populate required annotations: `rhdh.io/ai-asset-category`, `rhdh.io/ai-asset-version`, `rhdh.io/ai-asset-source`, OCI references (RHIDP-15296)
- [ ] 3.4 Implement entity ref sanitization (skill name → Backstage entity name) (RHIDP-15296)
- [ ] 3.5 Write unit tests for entity emission with various skillcard inputs (RHIDP-15296)

## 4. Multi-Registry Configuration (P0)

- [ ] 4.1 Define app-config schema for `ai-catalog-oci-skill-registry` with registry instances (RHIDP-15297)
- [ ] 4.2 Implement config parser with validation (required fields: `id`, `url`, `namespaces`, `auth`) (RHIDP-15297)
- [ ] 4.3 Implement Secret loader for registry credentials (reject plaintext, validate Secret exists and has required keys) (RHIDP-15297)
- [ ] 4.4 Implement ConfigMap/Secret loader for custom CA bundles (RHIDP-15297)
- [ ] 4.5 Implement per-registry sync interval scheduling (RHIDP-15297)
- [ ] 4.6 Write unit tests for config validation with valid/invalid inputs (RHIDP-15297)
- [ ] 4.7 Write integration test for multiple registry instances running concurrently (RHIDP-15297)

## 5. Digest-Based Incremental Sync (P0)

- [ ] 5.1 Define cursor storage schema (JSON format with `registryId`, `namespace`, `tagDigestMap`, `lastSync`) (RHIDP-15298)
- [ ] 5.2 Implement cursor persistence layer (ConfigMap storage in Kubernetes) (RHIDP-15298)
- [ ] 5.3 Implement tag-to-digest comparison logic (detect new, changed, removed tags) (RHIDP-15298)
- [ ] 5.4 Implement change detection algorithm: new tags → add entity, changed digest → update entity, removed tags → delete entity (RHIDP-15298)
- [ ] 5.5 Implement full refresh fallback (cursor schema mismatch, cursor expired, cursor unavailable) (RHIDP-15298)
- [ ] 5.6 Write unit tests for change detection with various cursor states (RHIDP-15298)
- [ ] 5.7 Write performance test for incremental sync of large namespace (1,945 tags, <10 changes) (RHIDP-15298)

## 6. Backend Module Registration (P0)

- [ ] 6.1 Implement backend module with `createBackendModule({ pluginId: 'catalog', moduleId: 'ai-catalog-oci-skill-registry' })` (RHIDP-15296)
- [ ] 6.2 Register entity provider via `catalogProcessingExtensionPoint` (RHIDP-15296)
- [ ] 6.3 Configure scheduled task runner for sync cycles (RHIDP-15297)
- [ ] 6.4 Write integration test for module registration and entity provider initialization (RHIDP-15296)

## 7. Dynamic Plugin Packaging (P1)

- [ ] 7.1 Create plugin package structure: `packages/backend/plugins/ai-catalog-oci-skill-registry/` (RHIDP-15296)
- [ ] 7.2 Define `package.json` with `backstage.role: backend-plugin-module` (RHIDP-15296)
- [ ] 7.3 Export alpha module: `./alpha` → `src/alpha.ts` (RHIDP-15296)
- [ ] 7.4 Build RHDH dynamic plugin artifact (tgz) (RHIDP-15296)
- [ ] 7.5 Test plugin installation in RHDH environment (app-config integration) (RHIDP-15297)

## 8. Documentation (P1)

- [ ] 8.1 Write README with installation instructions (app-config examples for each registry type) (RHIDP-15297)
- [ ] 8.2 Document auth provider setup for Quay, GHCR, Docker Hub, Harbor, Artifactory, OpenShift Internal (RHIDP-15297)
- [ ] 8.3 Document custom CA bundle configuration for air-gapped deployments (RHIDP-15297)
- [ ] 8.4 Document Secret structure for each auth type (RHIDP-15297)
- [ ] 8.5 Add troubleshooting section (common errors: TLS verification failed, Secret not found, invalid skillcard) (RHIDP-15296)

## 9. Integration Testing (P1)

- [ ] 9.1 Set up test OCI registry (e.g., local Harbor instance or Docker registry) (RHIDP-15296)
- [ ] 9.2 Publish test skill images with valid `skillcard.yaml` (RHIDP-15296)
- [ ] 9.3 Write integration test: full sync cycle (discover tags → fetch manifests → validate → emit entities) (RHIDP-15296)
- [ ] 9.4 Write integration test: incremental sync cycle (detect changed tags → update entities) (RHIDP-15298)
- [ ] 9.5 Write integration test: multi-registry sync (2 registries, different auth types) (RHIDP-15297)
- [ ] 9.6 Write integration test: air-gapped deployment (custom CA, Secret credentials) (RHIDP-15297)
