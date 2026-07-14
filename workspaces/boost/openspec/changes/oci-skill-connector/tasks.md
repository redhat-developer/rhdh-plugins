# Tasks: OCI Skill Registry Entity-Provider Connector

> **RHDHPLAN-1510 → RHDHPLAN-1507 Consolidation (2026-07-08):** Epic RHIDP-15315 (OCI Skill Registry Connector) was closed — scope absorbed by RHIDP-15294 (RHDHPLAN-1507). Stories RHIDP-15324 through RHIDP-15328 are now under RHIDP-15294. This openspec remains the authoritative specification for the OCI connector implementation.

## 1. OCI Registry Client (P0) — RHIDP-15324

- [ ] 1.1 Implement OCI Distribution Spec tag listing client (`GET /v2/<name>/tags/list`)
- [ ] 1.2 Implement manifest fetching with content negotiation (`Accept: application/vnd.oci.image.manifest.v1+json`)
- [ ] 1.3 Implement Docker v2 fallback for registries without OCI v1 support
- [ ] 1.4 Extract manifest digest from `Docker-Content-Digest` response header
- [ ] 1.5 Implement tag listing pagination via `Link` header or `last` query parameter
- [ ] 1.6 Implement namespace filtering (only list tags for repositories under configured namespace prefix)
- [ ] 1.7 Implement parallel manifest fetching with configurable concurrency (default 20, use `p-limit` library)
- [ ] 1.8 Extract OCI annotations from manifest's `annotations` field (OCI v1) or `config.Labels` (Docker v2)
- [ ] 1.9 Implement blob download via `GET /v2/<name>/blobs/<digest>` with streaming (no buffering)
- [ ] 1.10 Implement gzip decompression for compressed layers (`application/vnd.oci.image.layer.v1.tar+gzip`)
- [ ] 1.11 Add unit tests for OCI client (mock HTTP server, test tag listing, manifest fetch, blob download)

## 2. Skillcard Parsing and Entity Emission (P0) — RHIDP-15325

- [ ] 2.1 Implement skillcard layer identification by OCI annotation (`io.rhdh.skill.layer: skillcard`) or media type
- [ ] 2.2 Implement fallback to first layer if no skillcard layer is annotated
- [ ] 2.3 Implement YAML parsing using `js-yaml` with safe load
- [ ] 2.4 Integrate SDK's Zod schema validator from RHDHPLAN-1507 RHIDP-15258
- [ ] 2.5 Implement descriptive error logging for invalid skillcards (include image ref, validation failure details)
- [ ] 2.6 Implement entity building as `kind: AIResource` with `spec.type: skill`
- [ ] 2.7 Populate `metadata.annotations['rhdh.io/ai-asset-category']: skill`
- [ ] 2.8 Populate `metadata.annotations['rhdh.io/ai-asset-source']: oci://<registry>/<namespace>/<image>`
- [ ] 2.9 Populate `metadata.annotations['rhdh.io/ai-asset-digest']: <sha256>`
- [ ] 2.10 Implement default values for missing optional fields (`spec.owner: unknown`, `metadata.tags: []`)
- [ ] 2.11 Implement entity metadata population from skillcard fields (`owner`, `tags`, `links`)
- [ ] 2.12 Implement invalid skill rejection without aborting sync (log error, continue processing)
- [ ] 2.13 Implement aggregate error summary after sync ("95 skills emitted, 5 skills rejected")
- [ ] 2.14 Add unit tests for skillcard parsing (valid, invalid, malformed YAML, missing fields)
- [ ] 2.15 Add unit tests for entity emission (verify entity structure, annotations, metadata)

## 3. Incremental Sync and Caching (P1) — RHIDP-15326

- [ ] 3.1 Implement in-memory digest cache with structure `{ [imageRef]: { digest, lastSeen, skillEntityRef } }`
- [ ] 3.2 Implement 5-minute TTL on cache entries with automatic expiration
- [ ] 3.3 Implement digest comparison logic: detect added, changed, removed skills
- [ ] 3.4 Implement delta mutation emission via `applyMutation({ type: 'delta', added, removed })`
- [ ] 3.5 Implement full mutation on first sync (`applyMutation({ type: 'full', entities })`)
- [ ] 3.6 Implement disk persistence: write cache to `~/.backstage/cache/oci-skill-connector/digests.json` on shutdown
- [ ] 3.7 Implement disk cache loading on startup (treat loaded entries as expired, re-validate digests)
- [ ] 3.8 Implement cache re-validation after TTL expiration (re-fetch manifest, update `lastSeen` if digest unchanged)
- [ ] 3.9 Add unit tests for cache logic (add, change, remove detection, TTL expiration)
- [ ] 3.10 Add integration tests for disk persistence (write on shutdown, load on startup)

## 4. Authentication and Air-Gapped (P0) — RHIDP-15327

- [ ] 4.1 Implement K8s pull secret loader: read `config.json` from `pullSecretPath`
- [ ] 4.2 Parse Docker `config.json` format: extract `auths.<registry>.auth` field
- [ ] 4.3 Base64-decode `auth` field to get `username:password`
- [ ] 4.4 Implement `Authorization: Basic <base64(username:password)>` header for registry requests
- [ ] 4.5 Implement missing pull secret error handling (log error, attempt public access)
- [ ] 4.6 Implement custom CA bundle loader from `caBundlePath`
- [ ] 4.7 Integrate shared CA utility from RHIDP-15316 for HTTPS agent configuration
- [ ] 4.8 Implement fallback to system CA bundle if custom CA bundle is invalid
- [ ] 4.9 Implement per-registry auth configuration (distinct credentials and CA bundles per registry)
- [ ] 4.10 Implement credential reuse optimization (load pull secret once if shared across registries)
- [ ] 4.11 Implement air-gapped registry support (no external DNS resolution)
- [ ] 4.12 Implement DNS resolution failure handling (fail fast after 3 attempts)
- [ ] 4.13 Add unit tests for pull secret parsing (valid, missing, invalid format)
- [ ] 4.14 Add unit tests for CA bundle loading (valid, invalid, missing)
- [ ] 4.15 Add integration tests for multi-registry auth (distinct credentials per registry)

## 5. Scale Validation (P1) — RHIDP-15328

- [ ] 5.1 Create mock OCI registry test harness with 2,000 synthetic skill images
- [ ] 5.2 Implement mock registry endpoints: `GET /v2/<name>/tags/list`, `GET /v2/<name>/manifests/<ref>`, `GET /v2/<name>/blobs/<digest>`
- [ ] 5.3 Implement parallel manifest fetch with configurable concurrency (`oci.discovery.concurrency: 20`)
- [ ] 5.4 Implement batch processing of manifests (100 per batch, configurable)
- [ ] 5.5 Implement memory-bounded processing (no buffering all 2,000 manifests at once)
- [ ] 5.6 Add integration test: validate full sync of 2,000 images completes within 5 minutes
- [ ] 5.7 Add integration test: validate incremental sync with 10% churn (200 changed skills) completes within 2 minutes
- [ ] 5.8 Add performance measurement: log throughput (images/second) and memory usage
- [ ] 5.9 Add performance regression test: fail if throughput drops below 6 images/second
- [ ] 5.10 Verify peak memory usage stays below 500 MB during 2,000-image sync

## 6. Error Handling and Retry Logic (P1)

- [ ] 6.1 Implement exponential backoff retry for transient errors (connection timeout, 5xx errors)
- [ ] 6.2 Implement `Retry-After` header handling for HTTP 429 rate limiting
- [ ] 6.3 Implement no-retry for authentication errors (401, 403)
- [ ] 6.4 Implement registry unreachable handling (log error, retry with backoff 1s, 2s, 4s, 8s)
- [ ] 6.5 Implement multi-registry resilience (continue processing other registries if one fails)
- [ ] 6.6 Implement graceful degradation: serve cached entities if registry is temporarily unavailable
- [ ] 6.7 Add unit tests for retry logic (mock transient errors, verify backoff)
- [ ] 6.8 Add integration tests for error handling (mock registry downtime, verify resilience)

## 7. Integration Testing (P1)

- [ ] 7.1 Create integration test suite with mock OCI registry
- [ ] 7.2 Implement test: discover skills from multiple registries
- [ ] 7.3 Implement test: authenticate with K8s pull secret
- [ ] 7.4 Implement test: use custom CA bundle for self-signed registry
- [ ] 7.5 Implement test: incremental sync with digest-based change detection
- [ ] 7.6 Implement test: reject invalid skillcard without aborting sync
- [ ] 7.7 Implement test: handle registry downtime gracefully
- [ ] 7.8 Implement test: emit delta mutation for added/changed/removed skills
- [ ] 7.9 Verify entities appear in Backstage catalog after sync

## 8. Packaging (P2)

- [ ] 8.1 Create `boost-backend-module-oci-skill-connector` package with `createBackendModule`
- [ ] 8.2 Implement `OciSkillEntityProvider` extending SDK's `SkillEntityProvider` base class (from RHDHPLAN-1507 RHIDP-15294)
- [ ] 8.3 Register provider with `catalogProcessingExtensionPoint.addEntityProvider()`
- [ ] 8.4 Add package dependencies: `@boost/oci-skill-registry-sdk`, `js-yaml`, `p-limit`, `node-fetch`
- [ ] 8.5 Configure RHDH dynamic plugin export (OCI)
- [ ] 8.6 Create example `app-config.yaml` with OCI registry configuration
- [ ] 8.7 Add README with setup instructions, authentication guide, scaling recommendations
- [ ] 8.8 Publish to npm registry as `@boost/plugin-boost-backend-module-oci-skill-connector`

## 9. Documentation (P2)

- [ ] 9.1 Document OCI registry configuration schema in `app-config.yaml` format
- [ ] 9.2 Document K8s pull secret setup (how to create and mount pull secrets)
- [ ] 9.3 Document custom CA bundle setup for self-signed registries
- [ ] 9.4 Document multi-registry configuration examples
- [ ] 9.5 Document performance tuning parameters (`oci.discovery.concurrency`, batch size)
- [ ] 9.6 Document entity annotation scheme (`rhdh.io/ai-asset-*`)
- [ ] 9.7 Document troubleshooting guide (common errors, authentication failures, rate limiting)
- [ ] 9.8 Add architecture diagram showing OCI client → manifest fetch → skillcard parse → entity emission flow
